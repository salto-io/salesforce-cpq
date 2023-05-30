export function onAfterCalculate(quoteModel, quoteLineModels) {
console.log('after calculate ');
calculateQuantityForDiscountTier(quoteModel, quoteLineModels);
return Promise.resolve()
};
export function onAfterPriceRules(quote, quoteLineModels) {
console.log('after price rules ');
return Promise.resolve()
};
export function onBeforeCalculate(quoteModel, quoteLineModels, conn) {
console.log('On before');
//calculateQuantityForDiscountTier(quoteModel, quoteLineModels, conn);
var AccountPromo = quoteModel.record['Account_entitled_for_Promotion__c'], Quotestatus = quoteModel.record['SBQQ__Status__c'];
if (quoteLineModels.length > 0 && AccountPromo === false && Quotestatus === 'Draft'){
        quoteLineModels.forEach(function (quoteLineModel){
            quoteLineModel.record['SBQQ__ListPrice__c'] = quoteLineModel.record['SBQQ__OriginalPrice__c'];
        });
}
else if (quoteLineModels.length > 0 && AccountPromo === true && Quotestatus === 'Draft'){
var QL_Count_dict = {};
var QL_Count_dictTerm = {};
var QL_Count_dictCloud = {};
var quoteType;

var map_bundleListChilds = new Map();

quoteLineModels.forEach(function (quoteLineModel){
if( quoteLineModel.record['SBQQ__RequiredBy__c'] != null){
if( !map_bundleListChilds.has(quoteLineModel.record['SBQQ__RequiredBy__c'] ))
map_bundleListChilds.set(quoteLineModel.record['SBQQ__RequiredBy__c'] ,[]);
if( map_bundleListChilds.has(quoteLineModel.record['SBQQ__RequiredBy__c'] ) && map_bundleListChilds.get(quoteLineModel.record['SBQQ__RequiredBy__c']).length < 1)
map_bundleListChilds.get(quoteLineModel.record['SBQQ__RequiredBy__c']).push(quoteLineModel);
}

quoteType = quoteLineModel.record['SBQQ__Quote__r']['SBQQ__Type__c'];
if (quoteLineModel.record['SBQQ__Product__r']['WV_Count_for_Promotion__c'] === true && !(quoteLineModel.record['SBQQ__Product__c'] in QL_Count_dict)){
QL_Count_dict[quoteLineModel.record['SBQQ__Product__c']] = quoteLineModel;
if(quoteLineModel.record['VW_Product_Sub_Type__c'] == 'Term'){
QL_Count_dictTerm[quoteLineModel.record['SBQQ__Product__c']] = quoteLineModel;
}
else if(quoteLineModel.record['VW_Product_Sub_Type__c'] == 'Cloud'){
QL_Count_dictCloud[quoteLineModel.record['SBQQ__Product__c']] = quoteLineModel;
}
}
});

console.log('map_bundleListChilds ' , map_bundleListChilds);

var map_bundleQlAndType = new Map();
map_bundleListChilds.forEach(function(value, key, map){
if(map.has(key)){
for (var ql of value){
map_bundleQlAndType.set(key, ql.record['Quote_Line_Type__c']);
}
}
});
console.log('map_bundleQlAndType' , map_bundleQlAndType);

/*quoteLineModels.forEach(function(ql)
{
console.log('if yes' + map_bundleQlAndType.has(ql.record['Id']));
if(map_bundleQlAndType.has(ql.record['Id'])){
ql.record['Quote_Line_Type__c'] = map_bundleQlAndType.get(ql.record['Id']);
console.log('ql rec' + ql.record['Quote_Line_Type__c']);
}

});*/
console.log('quoteLineModels' , quoteLineModels);

var QL_CountTerm = Object.values(QL_Count_dictTerm);
var QL_CountCloud = Object.values(QL_Count_dictCloud);
var cloudQuoteType = 'Promotion Cloud ' + quoteType;
if (QL_CountTerm.length || QL_CountCloud.length){
var soql = " SELECT Id, SBQQ__Discount__c, SBQQ__Schedule__r.Name FROM SBQQ__DiscountTier__c WHERE ";
soql += " ((SBQQ__Schedule__r.Name = '" + quoteType + "' AND SBQQ__Schedule__r.WV_Promotion__c = True) AND ";
soql += " (SBQQ__LowerBound__c <= " + QL_CountTerm.length + " AND SBQQ__UpperBound__c > " + QL_CountTerm.length + "))";
soql += " OR ((SBQQ__Schedule__r.Name = '" + cloudQuoteType + "' AND SBQQ__Schedule__r.WV_Promotion__c = True) AND ";
soql += " (SBQQ__LowerBound__c <= " + QL_CountCloud.length + " AND SBQQ__UpperBound__c > " + QL_CountCloud.length + "))";
return conn.query(soql).then(function (results){
console.log('results.totalSize ' + results.totalSize);
if (results.totalSize){
var discountTerm;
var discountCloud;
if(results.records[0].SBQQ__Schedule__r.Name == quoteType){
discountTerm = results.records[0].SBQQ__Discount__c;
if(results.totalSize > 1){
discountCloud = results.records[1].SBQQ__Discount__c;
}
}
else{
discountCloud = results.records[0].SBQQ__Discount__c;
if(results.totalSize > 1){
discountTerm = results.records[1].SBQQ__Discount__c;
}
}
console.log('discountTerm ' + discountTerm);
quoteLineModels.forEach(function (quoteLineModel){
if(quoteLineModel.record['SBQQ__Product__r']['WV_Apply_Promotion__c'] === true && quoteLineModel.record['POT_Product__c'] === false){
if (quoteLineModel.record['VW_Product_Sub_Type__c'] == 'Term' || (quoteLineModel.record['VW_Product_Sub_Type__c'] == 'Bundle' && quoteLineModel.record['POT_Bundle__c'] === true)){
if(quoteModel.record['SBQQ__Type__c'] != 'Amendment' || quoteLineModel.record['SBQQ__EffectiveQuantity__c'] > 0){
console.log('here term');
quoteLineModel.record['SBQQ__ListPrice__c'] = quoteLineModel.record['SBQQ__OriginalPrice__c'] * (1 - discountTerm/100);
console.log('term list price ' + quoteLineModel.record['SBQQ__ListPrice__c'] );
}
}
else if (quoteLineModel.record['VW_Product_Sub_Type__c'] == 'Cloud'){
if(quoteModel.record['SBQQ__Type__c'] != 'Amendment' || quoteLineModel.record['SBQQ__EffectiveQuantity__c'] > 0){
console.log('here cloud');
quoteLineModel.record['SBQQ__ListPrice__c'] = quoteLineModel.record['SBQQ__OriginalPrice__c'] * (1 - discountCloud/100);
console.log('cloud list price ' + quoteLineModel.record['SBQQ__ListPrice__c'] + ' recordId ' + quoteLineModel.record['Id']);
}
}
}
});
}
});
}
}
return Promise.resolve();
};

function calculateQuantityForDiscountTier(quote, quoteLineModels) {
console.log('calculateQuantityForDiscountTier');
const prodAndSum = {};
const prodAndLines = {};
let sum;

quoteLineModels.forEach(element => {
console.log('here ' + element.record['Product_Code_End_Date__c']);
element.record['Quantity_for_Discount_Tier__c'] = element.record['SBQQ__EffectiveQuantity__c'];

if (!prodAndLines[element.record['Product_Code_End_Date__c']]) {
prodAndLines[element.record['Product_Code_End_Date__c']] = [];
prodAndSum[element.record['Product_Code_End_Date__c']] = 0;
}
prodAndLines[element.record['Product_Code_End_Date__c']].push(element);
sum = element.record['SBQQ__EffectiveQuantity__c'] + prodAndSum[element.record['Product_Code_End_Date__c']];
prodAndSum[element.record['Product_Code_End_Date__c']] = sum;

});

Object.keys(prodAndLines).forEach(key => {
if (prodAndLines[key] != null) {
prodAndLines[key].forEach(line => {
if(prodAndSum[key] != null) {
line.record['Quantity_for_Discount_Tier__c'] = prodAndSum[key];
}
});
}
});
}

/*export function onAfterPriceRules(quote, quoteLineModels) {

var map_bundleListChilds = new Map();

quoteLineModels.forEach(function (quoteLineModel)
{
if( quoteLineModel.record['SBQQ__RequiredBy__c'] != null)
{
if( !map_bundleListChilds.has(quoteLineModel.record['SBQQ__RequiredBy__c'] ))
map_bundleListChilds.set(quoteLineModel.record['SBQQ__RequiredBy__c'] ,[]);
if( map_bundleListChilds.has(quoteLineModel.record['SBQQ__RequiredBy__c'] ) && map_bundleListChilds.get(quoteLineModel.record['SBQQ__RequiredBy__c']).length < 1)
map_bundleListChilds.get(quoteLineModel.record['SBQQ__RequiredBy__c']).push(quoteLineModel);
}
});
console.log('map_bundleListChilds ' , map_bundleListChilds);

var map_bundleQlAndType = new Map();
map_bundleListChilds.forEach(function(value, key, map)
{
if(map.has(key))
{
for (var ql of value)
{
map_bundleQlAndType.set(key, ql.record['Quote_Line_Type__c']);
}
}
});
console.log('map_bundleQlAndType' , map_bundleQlAndType);

quoteLineModels.forEach(function(ql)
{
console.log('if yes' + map_bundleQlAndType.has(ql.record['Id']));
if(map_bundleQlAndType.has(ql.record['Id']))
{
ql.record['Quote_Line_Type__c'] = map_bundleQlAndType.get(ql.record['Id']);
console.log('ql rec' + ql.record['Quote_Line_Type__c']);
}
});
console.log('quoteLineModels' , quoteLineModels);
return Promise.resolve();
}*/

export function isFieldVisibleForObject(fieldName, quoteOrLine, conn, objectName){
if( objectName === 'QuoteLine__c' && ( fieldName === 'SBQQ__ListPrice__c' ||
fieldName === 'Reseller_Margin__c' || fieldName === 'SBQQ__NetTotal__c' ||
fieldName === 'SBQQ__RegularTotal__c' || fieldName === 'Comments__c' || fieldName === 'SBQQ__CustomerTotal__c' || fieldName === 'SBQQ__NetPrice__c'
|| fieldName === 'SBQQ__AdditionalDiscount__c' || fieldName === 'SBQQ__StartDate__c'
|| fieldName === 'End_Customer_Price__c'|| fieldName === 'Reseller_Margin__c'|| fieldName === 'SBQQ__EffectiveEndDate__c'||
fieldName === 'Quote_Line_Type__c' )){
if(quoteOrLine.Product_Type__c == 'Bundle' && quoteOrLine.POT_Bundle__c == 0){
return false;
}
}
if( objectName === 'Quote__c' && fieldName === 'SBQQ__SubscriptionTerm__c' ){
if(quoteOrLine.SBQQ__Type__c == 'Amendment'){
return false;
}
}

};

export function isFieldEditableForObject(fieldName, quoteOrLine, conn, objectName){
if( objectName === 'Quote__c' && fieldName === 'SBQQ__EndDate__c' ){
if(quoteOrLine.SBQQ__Type__c === 'Renewal' || quoteOrLine.SBQQ__Type__c === 'Amendment'){
return false;
}
}
if( objectName === 'Quote__c' && ( fieldName === 'SBQQ__StartDate__c' || fieldName==='SBQQ__EndDate__c' || fieldName==='Override_End_Date__c' )){
if(quoteOrLine.SBQQ__Type__c=== 'Quote' && quoteOrLine.Opportunity_Type__c != 'Seed'){
return false;
}
}
if( objectName === 'QuoteLine__c' && ( fieldName === 'SBQQ__SubscriptionTerm__c' || fieldName === 'SBQQ__StartDate__c' || fieldName === 'SBQQ__EndDate__c' )){
if(quoteOrLine.Product_Type__c == 'Bundle' || quoteOrLine.Product_Type__c != 'Bundle'){
return false;
}
}
if( objectName === 'QuoteLine__c' && fieldName === 'SBQQ__Quantity__c' ){
if(((quoteOrLine.SBQQ__RenewedSubscription__c != null && quoteOrLine.SBQQ__RenewedSubscription__c != '' ) || !quoteOrLine.Renewal_Rep_User__c ) && quoteOrLine.Quote_Line_Type__c === 'Renewal Business'  ){
return false;
}
else{
return true;
}
}
};