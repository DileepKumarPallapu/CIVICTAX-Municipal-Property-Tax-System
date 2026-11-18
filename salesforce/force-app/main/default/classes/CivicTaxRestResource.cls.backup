// CivicTaxRestResource.cls
// CivicTax 8.0, 9.0 & 10.0 Enterprise Apex REST Resource Endpoint
@RestResource(urlMapping='/civictax/v1/*')
global with sharing class CivicTaxRestResource {

    // GET /services/apexrest/civictax/v1/*
    @HttpGet
    global static void handleGet() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');

        String uri = req.requestURI;
        String endpoint = uri.substringAfter('/civictax/v1/');

        try {
            if (endpoint.startsWith('health') || endpoint.startsWith('status')) {
                Map<String, Object> health = new Map<String, Object>{
                    'status' => 'OK',
                    'service' => 'CivicTax Apex REST Gateway',
                    'version' => 'v10.0',
                    'timestamp' => System.now()
                };
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(health));
            } else if (endpoint.startsWith('properties')) {
                String sub = endpoint.substringAfter('properties');
                if (String.isNotBlank(sub) && sub.startsWith('/')) {
                    String propId = sub.substringAfter('/');
                    Property__c prop;
                    try {
                        prop = PropertyService.getProperty(propId);
                    } catch (CivicTaxSecurityService.SecurityException se) {
                        res.statusCode = 403;
                        res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                            'error' => 'FORBIDDEN',
                            'message' => 'Access denied: Property record is private or belongs to another citizen.'
                        }));
                        return;
                    } catch (Exception pe) {
                        if (!CivicTaxSecurityService.isOfficerOrAdmin()) {
                            res.statusCode = 403;
                            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                                'error' => 'FORBIDDEN',
                                'message' => 'Access denied: Property record is private or belongs to another citizen.'
                            }));
                            return;
                        } else {
                            res.statusCode = 404;
                            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                                'error' => 'NOT_FOUND',
                                'message' => pe.getMessage()
                            }));
                            return;
                        }
                    }

                    // Ownership validation for citizen access
                    Boolean isPrivileged = CivicTaxSecurityService.isOfficerOrAdmin();
                    Boolean isOwner = (prop.OwnerId == UserInfo.getUserId() || 
                                      (prop.Property_Owner__r != null && prop.Property_Owner__r.Email == UserInfo.getUserEmail()));
                    if (!isPrivileged && !isOwner) {
                        res.statusCode = 403;
                        res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                            'error' => 'FORBIDDEN',
                            'message' => 'Access denied: Property record belongs to another citizen.'
                        }));
                        return;
                    }

                    List<Property__c> sanitized = (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<Property__c>{prop});
                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf(JSON.serialize(sanitized[0]));
                } else {
                    // List properties with automatic user isolation and field sanitization
                    List<Property__c> props = PropertyService.listProperties(null, null, null);
                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf(JSON.serialize(props));
                }
            } else if (endpoint.startsWith('assessments')) {
                if (CivicTaxSecurityService.isOfficerOrAdmin()) {
                    List<Tax_Assessment__c> asms = [
                        SELECT Id, Name, Assessment_Year__c, Property__c, Base_Value__c, Total_Amount__c, 
                               Amount_Paid__c, Outstanding_Amount__c, Due_Date__c, Assessment_Status__c 
                        FROM Tax_Assessment__c 
                        ORDER BY Due_Date__c ASC 
                        LIMIT 100
                    ];
                    List<Tax_Assessment__c> sanitized = (List<Tax_Assessment__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, asms);
                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf(JSON.serialize(sanitized));
                } else {
                    Id currentUserId = UserInfo.getUserId();
                    String currentUserEmail = UserInfo.getUserEmail();
                    List<Tax_Assessment__c> citizenAsms = [
                        SELECT Id, Name, Assessment_Year__c, Property__c, Base_Value__c, Total_Amount__c, 
                               Amount_Paid__c, Outstanding_Amount__c, Due_Date__c, Assessment_Status__c 
                        FROM Tax_Assessment__c 
                        WHERE Property__r.OwnerId = :currentUserId OR Property__r.Property_Owner__r.Email = :currentUserEmail 
                        ORDER BY Due_Date__c ASC 
                        LIMIT 100
                    ];
                    List<Tax_Assessment__c> sanitized = (List<Tax_Assessment__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, citizenAsms);
                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf(JSON.serialize(sanitized));
                }
            } else if (endpoint.startsWith('dashboard')) {
                if (!CivicTaxSecurityService.canViewExecutiveDashboard()) {
                    res.statusCode = 403;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'error' => 'FORBIDDEN',
                        'message' => 'Dashboard revenue analytics restricted to Municipal Officers and Administrators.'
                    }));
                    return;
                }

                Map<String, Object> metrics = new Map<String, Object>();
                metrics.put('totalProperties', [SELECT count() FROM Property__c]);
                metrics.put('verifiedProperties', [SELECT count() FROM Property__c WHERE Verification_Status__c = 'VERIFIED']);
                metrics.put('pendingProperties', [SELECT count() FROM Property__c WHERE Verification_Status__c = 'PENDING']);
                
                AggregateResult[] revAgg = [SELECT SUM(Total_Amount__c) totalDemand, SUM(Amount_Paid__c) totalCollected FROM Tax_Assessment__c];
                Decimal demand = 0;
                Decimal collected = 0;
                if (!revAgg.isEmpty()) {
                    demand = (Decimal) revAgg[0].get('totalDemand');
                    collected = (Decimal) revAgg[0].get('totalCollected');
                }
                metrics.put('totalAssessedTax', demand != null ? demand : 0);
                metrics.put('totalRevenueCollected', collected != null ? collected : 0);
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(metrics));
            } else {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf('{"error":"ENDPOINT_NOT_FOUND"}');
            }
        } catch (CivicTaxSecurityService.SecurityException sex) {
            res.statusCode = 403;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'FORBIDDEN',
                'message' => sex.getMessage()
            }));
        } catch (Exception ex) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'INTERNAL_SERVER_ERROR',
                'message' => 'An error occurred while processing the request.'
            }));
        }
    }

    // POST /services/apexrest/civictax/v1/*
    @HttpPost
    global static void handlePost() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');

        String uri = req.requestURI;
        String endpoint = uri.substringAfter('/civictax/v1/');
        String bodyStr = req.requestBody != null ? req.requestBody.toString() : '';

        try {
            if (endpoint.startsWith('properties')) {
                Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(bodyStr);
                Property__c prop = PropertyService.registerProperty(
                    (String) payload.get('propertyNumber'),
                    (String) payload.get('address'),
                    (String) payload.get('category'),
                    Decimal.valueOf(String.valueOf(payload.get('builtUpArea'))),
                    (String) payload.get('zone'),
                    payload.get('latitude') != null ? Decimal.valueOf(String.valueOf(payload.get('latitude'))) : null,
                    payload.get('longitude') != null ? Decimal.valueOf(String.valueOf(payload.get('longitude'))) : null,
                    (String) payload.get('documentReference'),
                    payload.get('constructionYear') != null ? Integer.valueOf(payload.get('constructionYear')) : null
                );
                List<Property__c> sanitized = (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<Property__c>{prop});
                res.statusCode = 201;
                res.responseBody = Blob.valueOf(JSON.serialize(sanitized[0]));
            } else if (endpoint.startsWith('payments')) {
                Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(bodyStr);
                String assessmentId = (String) payload.get('assessmentId');

                // BOLA / IDOR Protection: Validate access to assessment before recording payment
                if (String.isNotBlank(assessmentId)) {
                    CivicTaxSecurityService.requireCanAccessAssessment((Id) assessmentId);
                }

                Tax_Payment__c pmt = PaymentService.recordPayment(
                    assessmentId,
                    Decimal.valueOf(String.valueOf(payload.get('amountPaid'))),
                    (String) payload.get('paymentMethod'),
                    (String) payload.get('transactionId')
                );
                List<Tax_Payment__c> sanitized = (List<Tax_Payment__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<Tax_Payment__c>{pmt});
                res.statusCode = 201;
                res.responseBody = Blob.valueOf(JSON.serialize(sanitized[0]));
            } else {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf('{"error":"ENDPOINT_NOT_FOUND"}');
            }
        } catch (CivicTaxSecurityService.SecurityException sex) {
            res.statusCode = 403;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'FORBIDDEN',
                'message' => sex.getMessage()
            }));
        } catch (Exception ex) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'BAD_REQUEST',
                'message' => ex.getMessage()
            }));
        }
    }

    // PATCH /services/apexrest/civictax/v1/*
    @HttpPatch
    global static void handlePatch() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');

        String uri = req.requestURI;
        String endpoint = uri.substringAfter('/civictax/v1/');
        String bodyStr = req.requestBody != null ? req.requestBody.toString() : '';

        try {
            if (endpoint.startsWith('properties')) {
                // Operation-level authorization: Property verification restricted to Officer or Admin
                if (!CivicTaxSecurityService.canVerifyProperty()) {
                    res.statusCode = 403;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'error' => 'FORBIDDEN',
                        'message' => 'Property verification is restricted to Municipal Officers and Administrators.'
                    }));
                    return;
                }

                Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(bodyStr);
                String propertyId = (String) payload.get('propertyId');
                String status = (String) payload.get('status');
                String notes = (String) payload.get('notes');
                Property__c prop = PropertyService.updateVerificationStatus(propertyId, status, notes);
                List<Property__c> sanitized = (List<Property__c>) CivicTaxSecurityService.sanitizeRecords(AccessType.READABLE, new List<Property__c>{prop});
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(sanitized[0]));
            } else {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf('{"error":"ENDPOINT_NOT_FOUND"}');
            }
        } catch (CivicTaxSecurityService.SecurityException sex) {
            res.statusCode = 403;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'FORBIDDEN',
                'message' => sex.getMessage()
            }));
        } catch (Exception ex) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'BAD_REQUEST',
                'message' => ex.getMessage()
            }));
        }
    }
}
