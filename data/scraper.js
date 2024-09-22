const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs');

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  Referer: 'https://www.otomoto.pl/',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

const baseUrl = 'https://www.otomoto.pl/osobowe/';
const car = 'article.ooa-yca59n.efpuxbr0';
const title = 'h1.efpuxbr9.ooa-1ed90th.er34gjf0';
const price = 'h3.efpuxbr16.ooa-1n2paoq.er34gjf0';
const basicData = 'dd.ooa-1omlbtp.efpuxbr13';
const nextPage = 'li.pagination-item.ooa-jolj3n';
const engineInfo = 'p.efpuxbr10.ooa-1tku07r.er34gjf0';
const numberOfPages = 10;

const transmissionTypeMapper = {
  automatyczna: 'automatic',
  manualna: 'manual',
  półautomatyczna: 'semiautomatic',
};

const fuelTypeMapper = {
  benzyna: 'petrol',
  diesel: 'diesel',
  hybryda: 'hybrid',
  elektryczny: 'electric',
  'benzyna+lpg': 'petrol+lpg',
  'benzyna+cng': 'petrol+cng',
  etanol: 'ethanol',
  'hybryda plug-in': 'plug-in hybrid',
  wodór: 'hydrogen',
};

function isNextPage(document) {
  return document.querySelector(nextPage) ? true : false;
}

async function getWebPage(url) {
  try {
    const { data } = await axios.get(url, { headers });

    const dom = new JSDOM(data);
    return dom.window.document;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getPageData(document, brand) {
  const cars = document.querySelectorAll(car);
  const carData = [];

  if (!cars.length) {
    return null;
  }

  for (const car of cars) {
    const carName = car.querySelector(title).textContent.toLowerCase() || null;
    const carModel = carName.split(' ').slice(1).join(' ') || null;
    const carPrice = Number(car.querySelector(price).textContent.split(' ').join('')) || null;
    const carBasicData = car.querySelectorAll(basicData);

    let carYear;
    let carFuel;
    let carMilage;
    let carTransmissionType;

    carBasicData.forEach((data) => {
      if (data.getAttribute('data-parameter') === 'mileage') {
        carMilage = Number(data.textContent.split(' ').slice(0, -1).join('')) || null;
      } else if (data.getAttribute('data-parameter') === 'year') {
        carYear = Number(data.textContent) || null;
      } else if (data.getAttribute('data-parameter') === 'fuel_type') {
        carFuel = data.textContent.toLowerCase() || null;
      } else if (data.getAttribute('data-parameter') === 'gearbox') {
        carTransmissionType = data.textContent.toLowerCase() || null;
      }
    });

    let carEngineCapacity;
    let carEnginePower;
    const carEngineInfo = car.querySelector(engineInfo).textContent.split(' • ');

    carEngineInfo.forEach((info) => {
      const infoParts = info.split(' ');

      if (infoParts[infoParts.length - 1] === 'cm3') {
        carEngineCapacity = Number(infoParts.slice(0, infoParts.length - 1).join('')) || null;
      }

      if (infoParts[infoParts.length - 1] === 'KM') {
        carEnginePower = Number(infoParts[0]) || null;
      }
    });

    carFuel = fuelTypeMapper[carFuel];
    carTransmissionType = transmissionTypeMapper[carTransmissionType];

    if (
      !brand ||
      !carModel ||
      !carPrice ||
      !carYear ||
      !carFuel ||
      !carMilage ||
      !carTransmissionType ||
      !carEngineCapacity ||
      !carEnginePower
    ) {
      continue;
    }

    carData.push({
      brand,
      model: carModel,
      price: carPrice,
      year: carYear,
      fuel: carFuel,
      milage: carMilage,
      transmissionType: carTransmissionType,
      engineCapacity: carEngineCapacity,
      enginePower: carEnginePower,
    });
  }

  return carData;
}

async function getCarBrandData(carBrand) {
  const carData = [];
  let pageNumber = 1;
  let url = `${baseUrl}${carBrand}?page=${pageNumber}`;

  while (pageNumber <= numberOfPages) {
    const document = await getWebPage(url);
    const data = getPageData(document, carBrand);

    if (!data) {
      break;
    }

    carData.push(...data);

    if (!isNextPage(document)) {
      break;
    }

    pageNumber++;
  }

  return carData;
}

async function main() {
  const carBrands = [
    'abarth',
    'acura',
    'aiways',
    'aixam',
    'alfa-romeo',
    'alpine',
    'arcfox',
    'asia',
    'aston-martin',
    'audi',
    'austin',
    'autobianchi',
    'avatr',
    'baic',
    'bentley',
    'bmw',
    'bmw-alpina',
    'brilliance',
    'bugatti',
    'buick',
    'byd',
    'cadillac',
    'casalini',
    'caterham',
    'cenntro',
    'changan',
    'chatenet',
    'chevrolet',
    'chrysler',
    'citroen',
    'cupra',
    'dacia',
    'daewoo',
    'daihatsu',
    'delorean',
    'dfm',
    'dfsk',
    'dkw',
    'dodge',
    'doosan',
    'dr-motor',
    'ds-automobiles',
    'e.go',
    'elaris',
    'faw',
    'fendt',
    'ferrari',
    'fiat',
    'fisker',
    'ford',
    'forthing',
    'gaz',
    'geely',
    'genesis',
    'gmc',
    'gwm',
    'hiphi',
    'honda',
    'hongqi',
    'hummer',
    'hyundai',
    'iamelectric',
    'ineos',
    'infiniti',
    'inny',
    'isuzu',
    'iveco',
    'jac',
    'jaecoo',
    'jaguar',
    'jeep',
    'jetour',
    'jinpeng',
    'kia',
    'ktm',
    'lada',
    'lamborghini',
    'lancia',
    'land-rover',
    'leapmotor',
    'levc',
    'lexus',
    'ligier',
    'lincoln',
    'lixiang',
    'lotus',
    'lti',
    'lucid',
    'lynk-&-co',
    'man',
    'maserati',
    'maximus',
    'maxus',
    'maybach',
    'mazda',
    'mclaren',
    'mercedes-benz',
    'mercury',
    'mg',
    'microcar',
    'mini',
    'mitsubishi',
    'morgan',
    'nio',
    'nissan',
    'nysa',
    'oldsmobile',
    'omoda',
    'opel',
    'peugeot',
    'piaggio',
    'plymouth',
    'polestar',
    'polonez',
    'pontiac',
    'porsche',
    'ram',
    'renault',
    'rolls-royce',
    'rover',
    'saab',
    'sarini',
    'saturn',
    'seat',
    'seres',
    'shuanghuan',
    'skoda',
    'skywell',
    'skyworth',
    'smart',
    'ssangyong',
    'subaru',
    'suzuki',
    'syrena',
    'tarpan',
    'tata',
    'tesla',
    'toyota',
    'trabant',
    'triumph',
    'uaz',
    'vauxhall',
    'velex',
    'volkswagen',
    'volvo',
    'voyah',
    'waltra',
    'warszawa',
    'wartburg',
    'wolga',
    'xiaomi',
    'xpeng',
    'zaporozec',
    'zastava',
    'zeekr',
    'zhidou',
    'zuk',
  ];

  const carData = [];
  let ctr = 1;

  for (const carBrand of carBrands) {
    const data = await getCarBrandData(carBrand);
    carData.push(...data);
    console.log((ctr / carBrands.length) * 100 + '%');
    ctr += 1;
  }

  const headers = Object.keys(carData[0]);
  const csv = [
    headers.join(','),
    ...carData.map((row) => headers.map((fieldName) => JSON.stringify(row[fieldName])).join(',')),
  ].join('\r\n');

  fs.writeFile('data.csv', csv, (err) => {
    if (err) {
      console.error(error);
      return;
    }

    console.log('Finished!');
  });
}

main();
