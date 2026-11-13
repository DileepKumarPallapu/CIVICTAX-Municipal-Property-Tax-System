// CivicTaxRestResource.cls
// CivicTax 8.0 Enterprise Apex REST Resource Endpoint
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
            if (endpoint.startsWith('properties')) {
                String sub = endpoint.substringAfter('properties');
                if (String.isNotBlank(sub) && sub.startsWith('/')) {
                    String propId = sub.substringAfter('/');
                    Property__c prop = PropertyService.getProperty(propId);
                    res.responseBody = Blob.valueOf(JSON.serialize(prop));
                } else {
                    List<Property__c> props = PropertyService.listProperties(null, null, null);
                    res.responseBody = Blob.valueOf(JSON.serialize(props));
                }
            } else if (endpoint.startsWith('assessments')) {
                List<Tax_Assessment__c> asms = [
                    SELECT Id, Name, Assessment_Year__c, Property__c, Base_Value__c, Total_Amount__c, 
                           Amount_Paid__c, Outstanding_Amount__c, Due_Date__c, Assessment_Status__c 
                    FROM Tax_Assessment__c 
                    WITH USER_MODE 
                    ORDER BY Due_Date__c ASC 
                    LIMIT 100
                ];
                res.responseBody = Blob.valueOf(JSON.serialize(asms));
            } else if (endpoint.startsWith('dashboard')) {
                Map<String, Object> metrics = new Map<String, Object>();
                metrics.put('totalProperties', [SELECT count() FROM Property__c WITH USER_MODE]);
                metrics.put('verifiedProperties', [SELECT count() FROM Property__c WHERE Verification_Status__c = 'VERIFIED' WITH USER_MODE]);
                metrics.put('pendingProperties', [SELECT count() FROM Property__c WHERE Verification_Status__c = 'PENDING' WITH USER_MODE]);
                
                AggregateResult[] revAgg = [SELECT SUM(Total_Amount__c) totalDemand, SUM(Amount_Paid__c) totalCollected FROM Tax_Assessment__c WITH USER_MODE];
                Decimal demand = 0;
                Decimal collected = 0;
                if (!revAgg.isEmpty()) {
                    demand = (Decimal) revAgg[0].get('totalDemand');
                    collected = (Decimal) revAgg[0].get('totalCollected');
                }
                metrics.put('totalAssessedTax', demand != null ? demand : 0);
                metrics.put('totalRevenueCollected', collected != null ? collected : 0);
                res.responseBody = Blob.valueOf(JSON.serialize(metrics));
            } else {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf('{"error":"ENDPOINT_NOT_FOUND"}');
            }
        } catch (Exception ex) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => ex.getMessage()}));
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
                res.statusCode = 201;
                res.responseBody = Blob.valueOf(JSON.serialize(prop));
            } else if (endpoint.startsWith('payments')) {
                Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(bodyStr);
                Tax_Payment__c pmt = PaymentService.recordPayment(
                    (String) payload.get('assessmentId'),
                    Decimal.valueOf(String.valueOf(payload.get('amountPaid'))),
                    (String) payload.get('paymentMethod'),
                    (String) payload.get('transactionId')
                );
                res.statusCode = 201;
                res.responseBody = Blob.valueOf(JSON.serialize(pmt));
            } else {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf('{"error":"ENDPOINT_NOT_FOUND"}');
            }
        } catch (Exception ex) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => ex.getMessage()}));
        }
    }
}
