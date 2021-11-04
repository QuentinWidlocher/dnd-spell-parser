const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { getName } = require('domutils');

const attributesByLang = {
    en: {
        level: 'level',
        higherLevel: '<br><strong><em>At Higher Levels</em></strong>. ',
        attributes: {
            'Casting Time': 'castingTime',
            'Range': 'range',
            'Components': 'components',
            'Duration': 'duration'
        },
        schools: {}
    },
    fr: {
        level: 'niveau',
        higherLevel: '<br><strong><em>Aux niveaux supérieurs</em></strong>. ',
        attributes: {
            'Temps d incantation ': 'castingTime',
            'Portée ': 'range',
            'Composantes ': 'components',
            'Durée ': 'duration'
        },
        schools: {
            'invocation': 'conjuration',
            'enchantement': 'enchantment',
            'évocation': 'evocation',
            'nécromancie': 'necromancy',
        }
    }
}

const registeredId = {}

function getId(name) {
    if (registeredId[name]) {
        return registeredId[name]
    } else {
        let id = uuidv4()
        registeredId[name] = id
        return id
    }
}

fs.readdirSync('./in/').forEach((file, i, arr) => {
    const $ = cheerio.load(fs.readFileSync(`./in/${file}`));

    const lang = attributesByLang[file.split('.')[1]]

    let spells = []

    let spellLength = $('.blocCarte').length

    $('.blocCarte').each((j, cardDom) => {

        process.stdout.write(`Parsed ${Math.round(((j+1)/spellLength)*100)}% of file ${i+1}/${arr.length} (${Math.round(((i+1)/arr.length)*100)}%)\r`)

        let spell = {}
        let card = $(cardDom)

        spell.name = card.find('h1').text()

        let levelAndSchool = card.find('.ecole').text()
        let [fullLevel, schoolAndRitual] = levelAndSchool.split(' - ')

        let [school, ritual] = schoolAndRitual.split(' ')

        spell.level = Number(fullLevel.replace(`${lang.level} `, ''))
        spell.school = lang.schools[school] || school
        spell.isRitual = ritual != undefined

        // The informations are stored in div without classes
        card.find('div:not([class])').each((j, infos) => {
            let [label, value] = $(infos).text().split(': ')

            let attribute = lang.attributes[label.replace(/\'/g, ' ')]

            if (!!attribute) {
                spell[attribute] = value
            }
        })

        let [description, higherLevel] = card.find('.description').html().split(lang.higherLevel)

        // The <br> are only necessary for line break, so we remove the \n
        spell.description = description.replace(/\n/g, '')
        spell.higherLevel = higherLevel ? higherLevel.replace(/\n/g, '') : undefined

        let trad = card.find('.trad')

        if (trad.length > 0) {
            spell.originalName = trad.text().replace(/(\[\s|\s\])/g, '');
        } else {
            spell.originalName = spell.name
        }

        spell.id = getId(spell.originalName)

        spells.push(spell)
    })

    fs.writeFileSync(`./temp/${file.replace('html', 'json')}`, JSON.stringify(spells))
});