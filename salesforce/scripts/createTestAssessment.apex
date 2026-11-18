Id propertyId = 'a03fj00001vw393AAA';
String assessmentYear = '2026-2027';

Tax_Assessment__c assessment =
    CivicTaxAssessmentService.calculateAndCreateAssessment(
        propertyId,
        assessmentYear
    );

System.debug('ASSESSMENT RESULT: ' + JSON.serializePretty(assessment));
