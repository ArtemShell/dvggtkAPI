const rp = require('request-promise');
const cheerio = require('cheerio');

Date.prototype.format = function(format = 'yyyy-mm-dd') {
    const replaces = {
        yyyy: this.getFullYear(),
        mm: ('0'+(this.getMonth() + 1)).slice(-2),
        dd: ('0'+this.getDate()).slice(-2),
        hh: ('0'+this.getHours()).slice(-2),
        MM: ('0'+this.getMinutes()).slice(-2),
        ss: ('0'+this.getSeconds()).slice(-2)
    };
    let result = format;
    for(const replace in replaces){
        result = result.replace(replace,replaces[replace]);
    }
    return result;
};

groupId = {
    "Б-11": 10,
    "Б-12/9": 120,
    "Б-21": 11,
    "Бз-11": 86,
    "Бз-21": 90,
    "Бз-31": 95,
    "ЗИО-11": 44,
    "ЗИО-12/9": 58,
    "ЗИО-21": 46,
    "ЗИО-22/9": 60,
    "ЗИО-32/9": 104,
    "ЗИО-33/9": 61,
    "ЗИОз-11": 117,
    "ЗИОз-21": 92,
    "ЗИОз-31": 100,
    "ЗИОк-13/9": 80,
    "ЗИОк-23/9": 106,
    "ПБ-11": 24,
    "ПБ-12": 25,
    "ПБ-12/9": 62,
    "ПБ-13/9": 42,
    "ПБ-21": 26,
    "ПБ-22": 27,
    "ПБ-23/9": 48,
    "ПБ-31": 29,
    "ПБ-32": 53,
    "ПБ-33/9": 30,
    "ПБ-43/9": 111,
    "ПБ-44/9": 112,
    "ПБз-11": 84,
    "ПБз-21": 89,
    "ПБз-31": 97,
    "ПБз-41": 101,
    "ПБзк-12": 85,
    "ПБк-24/9": 49,
    "ПБк-34/9": 63,
    "С-11": 22,
    "С-12/9": 45,
    "С-13/9": 121,
    "С-21": 64,
    "С-22/9": 15,
    "С-31": 114,
    "С-32/9": 7,
    "С-42/9": 67,
    "Сз-11": 91,
    "Сз-31": 98,
    "Сз-41": 118,
    "См-51/9": 19,
    "Сп-11": 68,
    "Сп-12/9": 41,
    "Сп-21/9": 20,
    "Сп-31/9": 75,
    "Сп-41/9": 76,
    "Ср-11": 12,
    "Ср-12/9": 107,
    "Ср-21": 13,
    "Ср-22/9": 14,
    "СРз-31": 96,
    "Т-12/9": 32,
    "Т-13/9": 33,
    "Т-21": 110,
    "Т-22/9": 35,
    "Т-23/9": 36,
    "Т-31": 119,
    "Т-32/9": 37,
    "Т-33/9": 38,
    "Т-42/9": 81,
    "Т-43/9": 69,
    "Тз-21": 93,
    "Тз-31": 99,
    "Тз-41": 116,
    "Ю-11": 1,
    "Ю-12": 113,
    "Ю-13": 73,
    "Ю-13/9": 72,
    "Ю-21": 2,
    "Ю-22": 6,
    "Ю-23/9": 108,
    "Ю-32/9": 78,
    "Юз-11": 87,
    "Юз-21": 82,
    "Юз-22": 88,
    "Юз-31": 103,
    "Юзк-12": 83,
    "Юк-14/9": 40,
    "Юк-24/9": 3,
    "Юк-33/9": 94,    
}

DAYS = {
    "Пн": "monday",
    "Вт": "thuesday",
    "Ср": "wednesday",
    "Чт": "thursday",
    "Пт": "friday",
    "Cб": "saturday",
    "Вс": "sunday",
}

const getRasp = (html, subgroup) => {
    const rasp = { even: {}, odd: {} };
    const $ = cheerio.load(html);

    let day;
    let week;

    $('tbody tr').each((i, row) => {
        if (i < 2) return;
        if ($(row).attr('class') == 'tr-divider') return;
        
        const zanyatia = [];

        $("td", row).each((i, cell) => {
            if ($(cell).attr('class') == 'urok-day') {
                const urokDay = $(cell).text();
                day = DAYS[urokDay[0] + urokDay[1]];
                week = (urokDay[3] - 1) ? "odd" : "even";
                return;
            }
            
            if ($(cell).attr('colspan') == 2 && $(cell).attr('class') != 'urok-empty') {
                if (rasp[week][day] == undefined) rasp[week][day] = [];
                rasp[week][day].push({
                    id: $(".urok-para", row).text(),
                    name: $(".urok-grup-pred", cell).text(),
                    teacher: $(".urok-grup-prep", cell).text(),
                    cabinet: $(".urok-grup-aud", cell).text(),
                });
                return;
            } else {
                if ($(cell).attr('class') == 'urok-empty') {
                    zanyatia.push({});
                    return;
                } else if ($(cell).attr('class') == 'urok-zanyatie') {
                    zanyatia.push({
                        id: $(".urok-para", row).text(),
                        name: $(".urok-grup-pred", cell).text(),
                        teacher: $(".urok-grup-prep", cell).text(),
                        cabinet: $(".urok-grup-aud", cell).text(),
                    });
                    return;
                }
            }
        });
        if (zanyatia != null && zanyatia[subgroup - 1] != null) {
            if (rasp[week][day] == undefined) rasp[week][day] = [];
            rasp[week][day].push(zanyatia[subgroup - 1]);
        }
    });

    return rasp;
}

const router = (app) => {
    app.get('/api/:group/:subgroup', (request, response) => {
        const group = request.params.group;
        const subgroup = request.params.subgroup;
        
        console.log(request.params);
        
        let url = 'http://rasp.dvggtk.org/index.php?rsp_type=tek&date='+new Date().format()+'&idg='+ groupId[group] +'&idp=NULL&ida=NULL&rsp_by=grup';

        console.log(url);

        rp(url).then((html) => {
            response.send(getRasp(html, subgroup));
        });
    });
}

module.exports = router;