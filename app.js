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

let files = fs.readdirSync('./in/')
let locales = Object.keys(attributesByLang)

// Loop over the available languages
locales.forEach((locale, l) => {
    let filesOfLang = files.filter(file => file.includes(locale))

    let spells = []

    const lang = attributesByLang[locale]

    // Loop over the files of specific language
    filesOfLang.forEach((file, f) => {
        const $ = cheerio.load(fs.readFileSync(`./in/${file}`));

        let spellLength = $('.blocCarte').length

        // Loop over the spells
        $('.blocCarte').each((s, cardDom) => {

            let spell = {}
            let card = $(cardDom)

            spell.name = card.find('h1').text()

            let trad = card.find('.trad')

            if (trad.length > 0) {
                spell.originalName = trad.text().replace(/(\[\s|\s\])/g, '');
            } else {
                spell.originalName = spell.name
            }

            let className = file.replace(`.${locale}.html`, '')

            let existingSpellIndex = spells.findIndex(s => s.originalName == spell.originalName)

            if (existingSpellIndex >= 0) {
                // If the spell is already in the list, we add the current class to the list of casters
                spells[existingSpellIndex].castedBy.push(className)
                return
            } else {
                // If the spell is new, we keep the name of the current caster
                spell.castedBy = [className]
            }

            spell.id = getId(spell.originalName)

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

            spells.push(spell)
        })

        process.stdout.write(`Parsed file ${Math.round((((f+1)*(l+1))/(files.length - 1))*100)}% (${(f+1)*(l+1)}/${files.length - 1})\r`)

    });  

    fs.writeFileSync(`./out/spells.${locale}.json`, JSON.stringify(spells))
})