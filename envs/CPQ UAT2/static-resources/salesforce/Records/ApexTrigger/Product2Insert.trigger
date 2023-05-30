trigger Product2Insert on Product2 (after insert) {
  for (Product2 product : Trigger.New) {
    product.Salto_ExternalId__c = product.Id;
  }
}