import chicagoData from '../data/locations/chicago.json';
import newYorkData from '../data/locations/new-york.json';
import phoenixData from '../data/locations/phoenix.json';
import aspenData from '../data/locations/aspen.json';
import atlantaData from '../data/locations/atlanta.json';
import austinData from '../data/locations/austin.json';
import bostonData from '../data/locations/boston.json';
import buffaloData from '../data/locations/buffalo.json';
import charlestonData from '../data/locations/charleston.json';
import charlotteData from '../data/locations/charlotte.json';
import chicagoCopyData from '../data/locations/chicago copy.json';
import cincinnatiData from '../data/locations/cincinnati.json';
import clevelandData from '../data/locations/cleveland.json';
import columbusData from '../data/locations/columbus.json';
import dallasData from '../data/locations/dallas.json';
import denverData from '../data/locations/denver.json';
import fortWorthData from '../data/locations/fort-worth.json';
import hartfordData from '../data/locations/hartford.json';
import houstonData from '../data/locations/houston.json';
import indianapolisData from '../data/locations/indianapolis.json';
import jacksonvilleData from '../data/locations/jacksonville.json';
import kansasCityData from '../data/locations/kansas-city.json';
import lasVegasData from '../data/locations/las-vegas.json';
import losAngelesData from '../data/locations/los-angeles.json';
import miamiData from '../data/locations/miami.json';
import minneapolisData from '../data/locations/minneapolis.json';
import nashvilleData from '../data/locations/nashville.json';
import newOrleansData from '../data/locations/new-orleans.json';
import palmBeachData from '../data/locations/palm-beach.json';
import philadelphiaData from '../data/locations/philadelphia.json';
import pittsburghData from '../data/locations/pittsburgh.json';
import portlandData from '../data/locations/portland.json';
import providenceData from '../data/locations/providence.json';
import raleighData from '../data/locations/raleigh.json';
import richmondData from '../data/locations/richmond.json';
import sacramentoData from '../data/locations/sacramento.json';
import saltLakeCityData from '../data/locations/salt-lake-city.json';
import sanAntonioData from '../data/locations/san-antonio.json';
import sanDiegoData from '../data/locations/san-diego.json';
import sanFranciscoData from '../data/locations/san-francisco.json';
import sanJoseData from '../data/locations/san-jose.json';
import santaFeData from '../data/locations/santa-fe.json';
import savannahData from '../data/locations/savannah.json';
import seattleData from '../data/locations/seattle.json';
import stLouisData from '../data/locations/st-louis.json';
import washingtonData from '../data/locations/washington.json';
import citiesData from '../data/cities.json';

export const locations = [
  chicagoData, chicagoCopyData, newYorkData, phoenixData, aspenData, atlantaData, austinData,
  bostonData, buffaloData, charlestonData, charlotteData, cincinnatiData, 
  clevelandData, columbusData, dallasData, denverData, fortWorthData, hartfordData, 
  houstonData, indianapolisData, jacksonvilleData, kansasCityData, lasVegasData,
  losAngelesData, miamiData, minneapolisData, nashvilleData, newOrleansData,
  palmBeachData, philadelphiaData, pittsburghData, portlandData, providenceData, 
  raleighData, richmondData, sacramentoData, saltLakeCityData, sanAntonioData, sanDiegoData, sanFranciscoData, sanJoseData, santaFeData, savannahData, seattleData, stLouisData, washingtonData
];
export const cities = citiesData.cities;

export function getLocation(citySlug: string) {
  const normalizedSlug = citySlug.toLowerCase().replace(/\s+/g, '-');
  console.log('getLocation - normalizedSlug:', normalizedSlug);
  console.log('getLocation - available locations:', locations.map(l => l.city || l.seo?.schema?.areaServed?.name || l.appraisers?.[0]?.city));

  // First try to find location by seo.schema.areaServed.name
  const locationBySeo = locations.find(location => 
    location.seo?.schema?.areaServed?.name?.toLowerCase().replace(/\s+/g, '-') === normalizedSlug
  );
  console.log('getLocation - locationBySeo:', locationBySeo?.city || locationBySeo?.seo?.schema?.areaServed?.name);
  if (locationBySeo) return locationBySeo;

  // Then try by city property
  const locationByCity = locations.find(location => 
    location.city?.toLowerCase().replace(/\s+/g, '-') === normalizedSlug
  );
  console.log('getLocation - locationByCity:', locationByCity?.city);
  if (locationByCity) return locationByCity;

  // Finally try by first appraiser's city
  const locationByAppraiser = locations.find(location => 
    location.appraisers?.[0]?.city?.toLowerCase().replace(/\s+/g, '-') === normalizedSlug
  );
  console.log('getLocation - locationByAppraiser:', locationByAppraiser?.appraisers?.[0]?.city);

  return locationBySeo || locationByCity || locationByAppraiser;
}

export function getAppraiser(appraiserId: string) {
  for (const location of locations) {
    const appraiser = location.appraisers.find(a => a.id === appraiserId);
    if (appraiser) {
      return appraiser;
    }
  }
  return null;
}