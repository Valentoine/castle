var request = require('request');
var cheerio = require('cheerio');
const fetch = require("node-fetch");
var fs = require('fs');
var jsonQ = require("jsonq");
var stringS = require('string-similarity');

/*fs.writeFile('RelaisEtChateaux.json', (err) => {
    if (err) throw err;
}); */


var nameCastles = [];
var urlCastles = [];
var nameMichelin = [];
const urlRC = "https://www.relaischateaux.com/us/update-destination-results";


async function retrieveUrlCastles(urlRC) {
  for(var count=1; count<=8; count++){
    try {
      const response = await fetch(urlRC,{
      		"credentials" : "include",
      		"headers" : {
      			"accept": "/",
      			"accept-language": "fr-FR,fr;q=0.9,en=US;q=0.8,en;q=0.7",
      			"cache-control":"no-cache",
      			"content-type":"application/x-www-form-urlencoded; charset=UTF-8",
      			"pragma": "no-cache",
      			"x-requested-with":"XMLHttpRequest"
      		},
      		"refferer":"https://www.relaischateaux.com/us/destinations/europe/france",
      		"reffererPolicy": "origin-when-cross-origin",
      		"body":"page="+count+"&areaId=78",
      		"method":"POST",
      		"mode":"cors"
      	})
      	const json = await response.json();
        const $ = cheerio.load(json.html);

        const tab = $('.mainTitle3 > a').map(function(i, el) {
          var deleteRestaurantOnly = ($(el).parent().parent().find('.priceTag > a').text());
          if(deleteRestaurantOnly != "View Availability"){
            nameCastles = nameCastles.concat($(el).children().text());
            return $(el).attr("href");
          }
        }).get();

        urlCastles = urlCastles.concat(tab);
    }
    catch (error) {
      console.log(error);
    }
  }
};

function arrangeText(text){
  text = text.replace('\n','');
  text = text.replace('\'',' ');
  text = text.replace(/^\s+|\s+$/g, '');
  return text;
}

function writeJson(listR, count){
  var obj = new Object();

  obj.nameCastle = nameCastles[count];
  obj.urlCastle = urlCastles[count];
  obj.nameRestaurant = listR;
  var string = JSON.stringify(obj);

  fs.appendFileSync("RelaisEtChateaux.json", string+',\n');
}

async function findRestaurants(count){
  try {
    request(urlCastles[count], function (error, response, html) {
      var $ = cheerio.load(html);
      const li = $('.jsSecondNavMain > li > a')[1];
      const urlRestaurant = $(li).attr("href");

      findNameRestaurants(urlRestaurant, count);
    });
  }
  catch (error) {
    console.log(error);
  }
}

async function findNameRestaurants(urlRestaurant, count){
  try{
    request(urlRestaurant, function (error, response, html) {
      var $2 = cheerio.load(html);
      const onlyOneRestaurant = $2('.jsSecondNavSub').html();

      if(onlyOneRestaurant == null){
        var nameR = $2('.hotelTabsHeaderTitle > h3').text();
        nameR = arrangeText(nameR);
        var listR = [nameR];
      }
      else{
        var nameR = $2('.jsSecondNavSub > li > a').map(function(i, el){
          return arrangeText($2(el).text());
        }).get();
        var listR = nameR;
      }
      writeJson(listR, count);
    });
  }
  catch (error) {
    console.log(error);
  }
}

async function namMichelin(){
  for(var i=1; i<=35; i++)
  {
    try{
      request('https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-'+i, function (error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          const tab = $('.poi_card-display-title').map(function(i, el) {
            return arrangeText(String($(el).text()));
          }).get();
          nameMichelin = nameMichelin.concat(tab);
        }
      });
    }
    catch(error){
      console.log(error);
    }
  }
}

async function verifyStars(parseJson, count){
  var stared = false;
  var listR = parseJson[count].nameRestaurant;
  var taille = listR.length;

  for(var j=0; j<listR.length; j++)
  {
    for(var k=0; k<nameMichelin.length; k++)
    {
      if(stringS.compareTwoStrings(listR[j], nameMichelin[k])>0.72)
        stared = true;
    }
  }
  if(stared == true)
    parseJson[count].stared = true;
  else
    parseJson[count].stared = false;
}

async function price(parseJson, count){
  var urlC = parseJson[count].urlCastle;

  try {
    request(urlC, function (error, response, html) {
      var $ = cheerio.load(html);
      const price= $('.propertyInfo__ratings').children()[1];
      var priceRange = $(price).attr().content;
      var priceMin = priceRange.substr(0, 3);

      parseJson[count].priceMin =  priceMin;
      parseJson[count].priceRange =  priceRange;

      if(parseJson[count].stared == true)
        writeJsonFinal(parseJson[count]);
    });
  }
  catch (error) {
    console.log(error);
  }
  /*const response = await fetch('https://www.relaischateaux.com/us/etablissement/rooms/0/bussiere-cote-d-or-la-bussiere-sur-ouche',{
      "credentials" : "include",
      "headers" : {
        "accept": "/",
        "accept-language": "fr-FR,fr;q=0.9,en=US;q=0.8,en;q=0.7",
        "cache-control":"no-cache",
        "content-type":"application/x-www-form-urlencoded; charset=UTF-8",
        "pragma": "no-cache",
        "x-requested-with":"XMLHttpRequest"
      },
      "refferer":urlC,
      "reffererPolicy": "origin-when-cross-origin",
      "body":"page="+count+"&areaId=78",
      "method":"POST",
      "mode":"cors"
    })*/
}

function writeJsonFinal(obj){
  var string = JSON.stringify(obj);
  fs.appendFileSync("final.json", string+',\n');
}

async function verifyPriceStars(){
  fs.readFile('RelaisEtChateaux.json',function(err,content){
    if(err) throw err;
    var parseJson = JSON.parse(content);

    for(var i=0; i<parseJson.length; i++)
    {
      verifyStars(parseJson, i);
      price(parseJson, i);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findAll() {
  /*fs.appendFileSync("RelaisEtChateaux.json", '[');
  await retrieveUrlCastles(urlRC);

  for(var i=0; i<urlCastles.length; i++){
    findRestaurants(i);
  }
  fs.appendFileSync("RelaisEtChateaux.json", ']');*/

  /*
  await namMichelin();
  await sleep(2000);
  verifyPriceStars();
  */

}

//findAll();
