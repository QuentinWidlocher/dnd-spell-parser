# AideDD Spell Parser

Convert spell lists from [AideDD](https://www.aidedd.org/dnd-filters/sorts.php) to json.

Used to fill my [D&D Spell Manager](https://github.com/QuentinWidlocher/dnd-spell-manager).

## Usage

Export the spells as *Spell Cards* from AideDD, save their generated html content and name them `<class>.<locale>.html`.

Put them in the `./in` folder and run `node app.js`.

It will export a json file per language, with uuids, casting classes and other data in the `./out` folder.