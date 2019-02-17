var request = require('request');
var cheerio = require('cheerio');
const fetch = require("node-fetch");

const url = "https://www.relaischateaux.com/us/update-destination-results";


async function recupUrlChateaux(url, compteur) {
  try {
    const response = await fetch(url,{
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
    		"body":"page="+compteur+"&areaId=78",
    		"method":"POST",
    		"mode":"cors"
    	})
    	const json = await response.json();
      const $ = cheerio.load(json.html);

      const tab = $('.mainTitle3 > a').map(function(i, el) {
        return $(el).attr("href");
      }).get();

      return tab;

  } catch (error) {
    console.log(error);
  }
};

var URLChateaux=[];

async function hotelInfo() {
  for(var compteur=1; compteur<=6; compteur++)
  {
    const result = await recupUrlChateaux(url, compteur);
    URLChateaux = URLChateaux.concat(result);
  }
};

var URLRestaurants=[];

async function recupURLMichelin() {
    for (var i = 1; i < 2; i++) {
        var html = await request('https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-' + i);
        var $ = cheerio.load(html);

        const tab = $('.poi_card-display-title').get();

        for (element of tab) {
            var url = $(element).parent().parent().parent().attr('href');
            var urlComplet = 'https://restaurant.michelin.fr' + url;
            URLRestaurants.push(urlComplet);
       }
    }
}

recupURLMichelin();

hotelInfo();
