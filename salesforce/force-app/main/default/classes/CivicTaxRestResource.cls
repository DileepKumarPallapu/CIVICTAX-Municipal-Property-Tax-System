/**
 * CivicTax REST gateway. The backend signs every private request with HMAC;
 * citizen role and Contact ownership are resolved from CivicTax_User__c.
 */
@RestResource(urlMapping='/civictax/v1/*')
global with sharing class CivicTaxRestResource {
    private static RestResponse responseRef;

    private static String getEndpoint(RestRequest req) {
        return req.requestURI.substringAfter('/civictax/v1/');
    }

    private static Map<String, Object> readBody(String bodyText) {
        if (String.isBlank(bodyText)) return new Map<String, Object>();
        return (Map<String, Object>) JSON.deserializeUntyped(bodyText);
    }

    private static String bodyString(RestRequest req) {
        return req.requestBody == null ? '' : req.requestBody.toString();
    }

    private static Id toId(Object value, String fieldName) {
        if (value == null || String.isBlank(String.valueOf(value))) {
            throw new CivicTaxRestException(fieldName + ' is required.');
        }
        try {
            return Id.valueOf(String.valueOf(value));
        } catch (Exception ex) {
            throw new CivicTaxRestException(fieldName + ' is invalid.');
        }
    }

    private static Decimal toDecimal(Object value, String fieldName) {
        if (value == null || String.isBlank(String.valueOf(value))) {
            throw new CivicTaxRestException(fieldName + ' is required.');
        }
        try {
            return Decimal.valueOf(String.valueOf(value));
        } catch (Exception ex) {
            throw new CivicTaxRestException(fieldName + ' must be numeric.');
        }
    }

    private static void writeJson(Integer statusCode, Object payload) {
        responseRef.statusCode = statusCode;
        responseRef.addHeader('Content-Type', 'application/json');
        responseRef.responseBody = Blob.valueOf(JSON.serialize(payload));
    }

    private static void writeError(Integer statusCode, String code, String message) {
        writeJson(statusCode, new Map<String, String>{ 'error' => code, 'message' => message });
    }

    private static Boolean isHealth(String endpoint) {
        return endpoint == 'health' || endpoint == 'status';
    }

    private static List<Property__c> queryPropertiesForResponse(String identifier) {
        if (String.isNotBlank(identifier)) {
            return new List<Property__c>{ PropertyService.getProperty(identifier) };
        }
        return PropertyService.listProperties(null, null, null);
    }

    // GET /services/apexrest/civictax/v1/{resource}
    @HttpGet
    global static void handleGet() {
        RestRequest req = RestContext.request;
        responseRef = RestContext.response;
        String endpoint = getEndpoint(req);
        String bodyText = bodyString(req);

        try {
            if (isHealth(endpoint)) {
                writeJson(200, new Map<String, Object>{
                    'status' => 'OK',
                    'service' => 'CivicTax Apex REST Gateway',
                    'version' => 'v1',
                    'timestamp' => System.now()
                });
                return;
            }

            CivicTaxGatewayAuth.authenticate(req, endpoint, bodyText);

            if (endpoint == 'properties' || endpoint.startsWith('properties/')) {
                String identifier = endpoint.startsWith('properties/') ? endpoint.substringAfter('properties/') : null;
                if (String.isNotBlank(identifier) &&
                    !CivicTaxSecurityService.isOfficerOrAdmin()) {
                    Property__c ownership =
                        CivicTaxPropertyAccessProbe.findByIdentifier(identifier);
                    if (ownership == null) {
                        throw new CivicTaxSecurityService.SecurityException(
                            'Access Denied: You do not have permission to access or modify this property.');
                    }
                    if (!CivicTaxSecurityService.canAccessProperty(ownership.Id)) {
                        throw new CivicTaxSecurityService.SecurityException(
                            'Access Denied: You do not have permission to access or modify this property.');
                    }
                }
                List<Property__c> records = queryPropertiesForResponse(identifier);
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, records));
                return;
            }

            if (endpoint == 'tax-rates') {
                List<Tax_Rate__c> records = [
                    SELECT Id, Name, Category__c, Rate_Per_SqFt__c,
                           Effective_Start_Date__c, Effective_End_Date__c,
                           CreatedDate, LastModifiedDate
                    FROM Tax_Rate__c
                    ORDER BY Effective_Start_Date__c DESC NULLS LAST
                    LIMIT 500
                ];
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, records));
                return;
            }

            if (endpoint == 'assessments') {
                List<Tax_Assessment__c> records;
                if (CivicTaxSecurityService.isOfficerOrAdmin()) {
                    records = [
                        SELECT Id, Name, Assessment_Number__c, Assessment_Year__c, Property__c,
                               Property__r.Property_Number__c, Property__r.Property_Category__c,
                               Property__r.Built_Up_Area__c, Property__r.Zone__c,
                               Property__r.Owner__c, Property__r.Owner__r.Name,
                               Property__r.Property_Owner__c, Property__r.Property_Owner__r.Name,
                               Property__r.Property_Owner__r.Email,
                               Base_Value__c, Base_Tax__c, Applied_Rate_Per_Sq_Ft__c, Penalty__c,
                               Discount__c, Total_Tax__c, Total_Amount__c, Amount_Paid__c,
                               Outstanding_Amount__c, Due_Date__c, Assessment_Status__c
                        FROM Tax_Assessment__c ORDER BY Due_Date__c ASC LIMIT 500
                    ];
                } else if (String.isNotBlank(CivicTaxSecurityService.getRequestIdentity())) {
                    // Backend-authenticated CivicTax citizen: restrict by mapped Contact.
                    Id contactId = CivicTaxSecurityService.getCurrentCitizenContactId();
                    records = [
                        SELECT Id, Name, Assessment_Number__c, Assessment_Year__c, Property__c,
                               Property__r.Property_Number__c, Property__r.Property_Category__c,
                               Property__r.Built_Up_Area__c, Property__r.Zone__c,
                               Property__r.Owner__c, Property__r.Owner__r.Name,
                               Property__r.Property_Owner__c, Property__r.Property_Owner__r.Name,
                               Property__r.Property_Owner__r.Email,
                               Base_Value__c, Base_Tax__c, Applied_Rate_Per_Sq_Ft__c, Penalty__c,
                               Discount__c, Total_Tax__c, Total_Amount__c, Amount_Paid__c,
                               Outstanding_Amount__c, Due_Date__c, Assessment_Status__c
                        FROM Tax_Assessment__c
                        WHERE Property__r.Owner__c = :contactId OR Property__r.Property_Owner__c = :contactId
                        ORDER BY Due_Date__c ASC LIMIT 500
                    ];
                } else {
                    // Native Salesforce citizen session: restrict to records owned by this user.
                    Id currentUserId = UserInfo.getUserId();
                    records = [
                        SELECT Id, Name, Assessment_Number__c, Assessment_Year__c, Property__c,
                               Property__r.Property_Number__c, Property__r.Property_Category__c,
                               Property__r.Built_Up_Area__c, Property__r.Zone__c,
                               Property__r.Owner__c, Property__r.Owner__r.Name,
                               Property__r.Property_Owner__c, Property__r.Property_Owner__r.Name,
                               Property__r.Property_Owner__r.Email,
                               Base_Value__c, Base_Tax__c, Applied_Rate_Per_Sq_Ft__c, Penalty__c,
                               Discount__c, Total_Tax__c, Total_Amount__c, Amount_Paid__c,
                               Outstanding_Amount__c, Due_Date__c, Assessment_Status__c
                        FROM Tax_Assessment__c
                        WHERE OwnerId = :currentUserId OR Property__r.OwnerId = :currentUserId
                        ORDER BY Due_Date__c ASC LIMIT 500
                    ];
                }
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, records));
                return;
            }

            if (endpoint == 'payments' || endpoint.startsWith('payments/')) {
                List<Tax_Payment__c> records;
                if (endpoint.startsWith('payments/')) {
                    Id assessmentId = toId(endpoint.substringAfter('payments/'), 'Assessment ID');
                    records = CivicTaxPaymentService.getPaymentsForAssessment(assessmentId);
                } else if (CivicTaxSecurityService.isOfficerOrAdmin()) {
                    records = [
                        SELECT Id, Name, Payment_Reference__c, Receipt_Number__c, Assessment__c,
                               Amount__c, Amount_Paid__c, Payment_Date__c, Payment_Method__c,
                               Transaction_Status__c, Transaction_ID__c, Payment_Status__c
                        FROM Tax_Payment__c ORDER BY Payment_Date__c DESC LIMIT 500
                    ];
                } else {
                    Id contactId = CivicTaxSecurityService.getCurrentCitizenContactId();
                    records = [
                        SELECT Id, Name, Payment_Reference__c, Receipt_Number__c, Assessment__c,
                               Amount__c, Amount_Paid__c, Payment_Date__c, Payment_Method__c,
                               Transaction_Status__c, Transaction_ID__c, Payment_Status__c
                        FROM Tax_Payment__c
                        WHERE Assessment__r.Property__r.Owner__c = :contactId
                           OR Assessment__r.Property__r.Property_Owner__c = :contactId
                        ORDER BY Payment_Date__c DESC LIMIT 500
                    ];
                }
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, records));
                return;
            }

            if (endpoint == 'grievances') {
                List<Grievance__c> records;
                if (CivicTaxSecurityService.isOfficerOrAdmin()) {
                    records = [
                        SELECT Id, Name, Property__c, Citizen__c, Citizen__r.Full_Name__c, Citizen__r.Email__c, CivicTax_ID__c, Subject__c,
                               Description__c, Priority__c, Status__c, Resolution_Comments__c,
                               Resolution_Date__c, CreatedDate
                        FROM Grievance__c ORDER BY CreatedDate DESC LIMIT 500
                    ];
                } else {
                    String userKey = CivicTaxSecurityService.getRequestIdentity();
                    records = [
                        SELECT Id, Name, Property__c, Citizen__c, Citizen__r.Full_Name__c, Citizen__r.Email__c, CivicTax_ID__c, Subject__c,
                               Description__c, Priority__c, Status__c, Resolution_Comments__c,
                               Resolution_Date__c, CreatedDate
                        FROM Grievance__c WHERE CivicTax_ID__c = :userKey
                        ORDER BY CreatedDate DESC LIMIT 500
                    ];
                }
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, records));
                return;
            }

            if (endpoint == 'reassessments' || endpoint.startsWith('reassessments/')) {
                List<Reassessment_Request__c> records;
                if (endpoint.startsWith('reassessments/')) {
                    Id propertyId = toId(endpoint.substringAfter('reassessments/'), 'Property ID');
                    CivicTaxSecurityService.requireCanAccessProperty(propertyId);
                    records = [
                        SELECT Id, Name, Request_Number__c, Property__c, Citizen__c, CivicTax_ID__c,
                               Original_Assessment__c, Requested_Change__c, Supporting_Reason__c,
                               Approval_Status__c, Decision_Comments__c, CreatedDate
                        FROM Reassessment_Request__c WHERE Property__c = :propertyId
                        ORDER BY CreatedDate DESC LIMIT 200
                    ];
                } else if (CivicTaxSecurityService.isOfficerOrAdmin()) {
                    records = [
                        SELECT Id, Name, Request_Number__c, Property__c, Citizen__c, CivicTax_ID__c,
                               Original_Assessment__c, Requested_Change__c, Supporting_Reason__c,
                               Approval_Status__c, Decision_Comments__c, CreatedDate
                        FROM Reassessment_Request__c ORDER BY CreatedDate DESC LIMIT 500
                    ];
                } else {
                    String userKey = CivicTaxSecurityService.getRequestIdentity();
                    records = [
                        SELECT Id, Name, Request_Number__c, Property__c, Citizen__c, CivicTax_ID__c,
                               Original_Assessment__c, Requested_Change__c, Supporting_Reason__c,
                               Approval_Status__c, Decision_Comments__c, CreatedDate
                        FROM Reassessment_Request__c WHERE CivicTax_ID__c = :userKey
                        ORDER BY CreatedDate DESC LIMIT 200
                    ];
                }
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, records));
                return;
            }

            if (endpoint == 'dashboard') {
                CivicTaxSecurityService.requireCanViewExecutiveDashboard();
                AggregateResult[] revenue = [
                    SELECT SUM(Total_Amount__c) totalDemand, SUM(Amount_Paid__c) totalCollected
                    FROM Tax_Assessment__c
                ];
                Decimal demand = revenue.isEmpty() ? 0 : (Decimal) revenue[0].get('totalDemand');
                Decimal collected = revenue.isEmpty() ? 0 : (Decimal) revenue[0].get('totalCollected');
                Integer totalProperties = [SELECT count() FROM Property__c];
                Integer verifiedProperties = [SELECT count() FROM Property__c WHERE Verification_Status__c = 'VERIFIED'];
                Integer pendingProperties = [SELECT count() FROM Property__c WHERE Verification_Status__c = 'PENDING'];
                Integer openGrievances = [SELECT count() FROM Grievance__c WHERE Status__c IN ('OPEN', 'IN_PROGRESS')];
                writeJson(200, new Map<String, Object>{
                    'totalProperties' => totalProperties,
                    'verifiedProperties' => verifiedProperties,
                    'pendingProperties' => pendingProperties,
                    'totalAssessedTax' => demand == null ? 0 : demand,
                    'totalRevenueCollected' => collected == null ? 0 : collected,
                    'totalOutstandingDues' => (demand == null ? 0 : demand) - (collected == null ? 0 : collected),
                    'openGrievances' => openGrievances
                });
                return;
            }

            writeError(404, 'ENDPOINT_NOT_FOUND', 'The requested CivicTax endpoint does not exist.');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            writeError(401, 'GATEWAY_AUTH_FAILED', ex.getMessage());
        } catch (CivicTaxSecurityService.SecurityException ex) {
            writeError(403, 'FORBIDDEN', ex.getMessage());
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'CivicTax GET error: ' + ex.getMessage());
            writeError(400, 'BAD_REQUEST', ex.getMessage());
        }
    }

    // POST /services/apexrest/civictax/v1/{resource}
    @HttpPost
    global static void handlePost() {
        RestRequest req = RestContext.request;
        responseRef = RestContext.response;
        String endpoint = getEndpoint(req);
        String bodyText = bodyString(req);

        try {
            CivicTaxGatewayAuth.authenticate(req, endpoint, bodyText);
            Map<String, Object> payload = readBody(bodyText);

            if (endpoint == 'properties') {
                Property__c record = PropertyService.registerProperty(
                    String.valueOf(payload.get('propertyNumber')),
                    String.valueOf(payload.get('address')),
                    String.valueOf(payload.get('category')),
                    toDecimal(payload.get('builtUpArea'), 'Built-up area'),
                    String.valueOf(payload.get('zone')),
                    payload.get('latitude') == null ? null : toDecimal(payload.get('latitude'), 'Latitude'),
                    payload.get('longitude') == null ? null : toDecimal(payload.get('longitude'), 'Longitude'),
                    payload.get('documentReference') == null ? null : String.valueOf(payload.get('documentReference')),
                    payload.get('constructionYear') == null ? null : Integer.valueOf(String.valueOf(payload.get('constructionYear')))
                );
                writeJson(201, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint == 'tax-rates') {
                CivicTaxSecurityService.requireAdmin();
                if (!CivicTaxSecurityService.canCreateObject('Tax_Rate__c')) {
                    throw new CivicTaxSecurityService.SecurityException('Tax rate creation permission is required.');
                }
                String category = String.valueOf(payload.get('category')).toUpperCase();
                Set<String> allowedCategories = new Set<String>{ 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL', 'AGRICULTURAL' };
                Decimal rate = toDecimal(payload.get('ratePerSqFt'), 'Rate per square foot');
                if (!allowedCategories.contains(category) || rate <= 0) {
                    throw new CivicTaxRestException('A valid category and positive rate are required.');
                }
                Date startDate = payload.get('effectiveStartDate') == null
                    ? Date.today() : Date.valueOf(String.valueOf(payload.get('effectiveStartDate')));
                Tax_Rate__c record = new Tax_Rate__c(
                    Category__c = category,
                    Rate_Per_SqFt__c = rate,
                    Effective_Start_Date__c = startDate,
                    Effective_End_Date__c = payload.get('effectiveEndDate') == null || String.isBlank(String.valueOf(payload.get('effectiveEndDate')))
                        ? null : Date.valueOf(String.valueOf(payload.get('effectiveEndDate')))
                );
                insert record;
                writeJson(201, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint == 'assessments') {
                Tax_Assessment__c record = CivicTaxAssessmentService.calculateAndCreateAssessment(
                    toId(payload.get('propertyId'), 'Property ID'),
                    String.valueOf(payload.get('assessmentYear'))
                );
                writeJson(201, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint == 'payments') {
                Tax_Payment__c record = CivicTaxPaymentService.processPayment(
                    toId(payload.get('assessmentId'), 'Assessment ID'),
                    toDecimal(payload.get('amountPaid'), 'Payment amount'),
                    String.valueOf(payload.get('paymentMethod')),
                    String.valueOf(payload.get('transactionId'))
                );
                writeJson(201, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint == 'grievances') {
                Id propertyId = payload.get('propertyId') == null || String.isBlank(String.valueOf(payload.get('propertyId')))
                    ? null : Id.valueOf(String.valueOf(payload.get('propertyId')));
                Grievance__c record = CivicTaxGrievanceService.submitGrievance(
                    propertyId,
                    String.valueOf(payload.get('subject')),
                    String.valueOf(payload.get('description')),
                    String.valueOf(payload.get('priority'))
                );
                writeJson(201, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint == 'reassessments') {
                Id originalAssessmentId = payload.get('originalAssessmentId') == null || String.isBlank(String.valueOf(payload.get('originalAssessmentId')))
                    ? null : Id.valueOf(String.valueOf(payload.get('originalAssessmentId')));
                Reassessment_Request__c record = CivicTaxReassessmentService.submitRequest(
                    toId(payload.get('propertyId'), 'Property ID'),
                    originalAssessmentId,
                    String.valueOf(payload.get('requestedChange')),
                    String.valueOf(payload.get('supportingReason'))
                );
                writeJson(201, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            writeError(404, 'ENDPOINT_NOT_FOUND', 'The requested CivicTax endpoint does not exist.');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            writeError(401, 'GATEWAY_AUTH_FAILED', ex.getMessage());
        } catch (CivicTaxSecurityService.SecurityException ex) {
            writeError(403, 'FORBIDDEN', ex.getMessage());
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'CivicTax POST error: ' + ex.getMessage());
            writeError(400, 'BAD_REQUEST', ex.getMessage());
        }
    }

    // PATCH /services/apexrest/civictax/v1/{resource}
    @HttpPatch
    global static void handlePatch() {
        RestRequest req = RestContext.request;
        responseRef = RestContext.response;
        String endpoint = getEndpoint(req);
        String bodyText = bodyString(req);

        try {
            CivicTaxGatewayAuth.authenticate(req, endpoint, bodyText);

            if (endpoint == 'properties' || endpoint.endsWith('/verify')) {
                CivicTaxSecurityService.requireCanVerifyProperty();
            }

            Map<String, Object> payload = readBody(bodyText);

            if (endpoint.startsWith('tax-rates/')) {
                CivicTaxSecurityService.requireAdmin();
                if (!CivicTaxSecurityService.canUpdateObject('Tax_Rate__c')) {
                    throw new CivicTaxSecurityService.SecurityException('Tax rate update permission is required.');
                }
                Id rateId = toId(endpoint.substringAfter('tax-rates/'), 'Tax Rate ID');
                List<Tax_Rate__c> matches = [
                    SELECT Id, Category__c, Rate_Per_SqFt__c, Effective_Start_Date__c, Effective_End_Date__c
                    FROM Tax_Rate__c WHERE Id = :rateId LIMIT 1
                ];
                if (matches.isEmpty()) throw new CivicTaxRestException('Tax rate not found.');
                Tax_Rate__c record = matches[0];
                if (payload.containsKey('category')) record.Category__c = String.valueOf(payload.get('category')).toUpperCase();
                if (payload.containsKey('ratePerSqFt')) record.Rate_Per_SqFt__c = toDecimal(payload.get('ratePerSqFt'), 'Rate per square foot');
                if (payload.containsKey('effectiveStartDate')) record.Effective_Start_Date__c = Date.valueOf(String.valueOf(payload.get('effectiveStartDate')));
                if (payload.containsKey('effectiveEndDate')) record.Effective_End_Date__c = String.isBlank(String.valueOf(payload.get('effectiveEndDate'))) ? null : Date.valueOf(String.valueOf(payload.get('effectiveEndDate')));
                if (record.Rate_Per_SqFt__c == null || record.Rate_Per_SqFt__c <= 0) throw new CivicTaxRestException('Rate per square foot must be positive.');
                update record;
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint.startsWith('properties/') && !endpoint.endsWith('/verify')) {
                Id propertyId = toId(endpoint.substringAfter('properties/'), 'Property ID');
                Property__c record = PropertyService.updatePropertyDetails(
                    propertyId,
                    payload.get('address') == null ? null : String.valueOf(payload.get('address')),
                    payload.get('category') == null ? null : String.valueOf(payload.get('category')),
                    payload.get('builtUpArea') == null ? null : toDecimal(payload.get('builtUpArea'), 'Built-up area'),
                    payload.get('zone') == null ? null : String.valueOf(payload.get('zone')),
                    payload.get('documentReference') == null ? null : String.valueOf(payload.get('documentReference')),
                    payload.get('constructionYear') == null ? null : Integer.valueOf(String.valueOf(payload.get('constructionYear'))),
                    payload.get('latitude') == null ? null : toDecimal(payload.get('latitude'), 'Latitude'),
                    payload.get('longitude') == null ? null : toDecimal(payload.get('longitude'), 'Longitude')
                );
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint == 'properties' || endpoint.endsWith('/verify')) {
                String propertyId = payload.get('propertyId') == null
                    ? (endpoint.endsWith('/verify') ? endpoint.split('/')[1] : null)
                    : String.valueOf(payload.get('propertyId'));
                Property__c record = PropertyService.updateVerificationStatus(
                    propertyId,
                    String.valueOf(payload.get('status')),
                    payload.get('notes') == null ? null : String.valueOf(payload.get('notes'))
                );
                writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                return;
            }

            if (endpoint.startsWith('grievances/')) {
                List<String> parts = endpoint.split('/');
                if (parts.size() == 3 && parts[2] == 'resolve') {
                    Grievance__c record = CivicTaxGrievanceService.resolveGrievance(
                        toId(parts[1], 'Grievance ID'),
                        String.valueOf(payload.get('comments'))
                    );
                    writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                    return;
                }
            }

            if (endpoint.startsWith('reassessments/')) {
                List<String> parts = endpoint.split('/');
                if (parts.size() == 3 && (parts[2] == 'approve' || parts[2] == 'reject')) {
                    Id requestId = toId(parts[1], 'Reassessment ID');
                    String comments = String.valueOf(payload.get('comments'));
                    Reassessment_Request__c record = parts[2] == 'approve'
                        ? CivicTaxReassessmentService.approveReassessment(requestId, comments)
                        : CivicTaxReassessmentService.rejectReassessment(requestId, comments);
                    writeJson(200, CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<SObject>{ record })[0]);
                    return;
                }
            }

            writeError(404, 'ENDPOINT_NOT_FOUND', 'The requested CivicTax endpoint does not exist.');
        } catch (CivicTaxGatewayAuth.GatewayAuthException ex) {
            writeError(401, 'GATEWAY_AUTH_FAILED', ex.getMessage());
        } catch (CivicTaxSecurityService.SecurityException ex) {
            writeError(403, 'FORBIDDEN', ex.getMessage());
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'CivicTax PATCH error: ' + ex.getMessage());
            writeError(400, 'BAD_REQUEST', ex.getMessage());
        }
    }

    public class CivicTaxRestException extends Exception {}
}
