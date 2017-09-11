// For any future contributors:
//
// DDB character sheets are bound to change the structure over time so in
// order to prevent having to re-write the entire extension each time, the
// parsing code is separated out. If you make a pull request that contains
// any direct element usage in the non-parsing code, it will be rejected.

var ddbdice = {
    roll_die: function(die) {
        let min = 1;
        let max = Math.floor(die);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    roll_d20: function() {
        return ddbdice.roll_die(20);
    },

    roll_d12: function() {
        return ddbdice.roll_die(12);
    },

    roll_d8: function() {
        return ddbdice.roll_die(8);
    },

    roll_d6: function() {
        return ddbdice.roll_die(6);
    },

    roll_d4: function() {
        return ddbdice.roll_die(4);
    },
};

var ddbparser = {
    parseBonus: function(sign, value) {
        let signValue = 1;
        if (sign == "-") signValue = -1;
        return signValue * parseInt(value, 10);
    },

    // returns { stat: string, name: string, bonus: int }
    parseSkillItem: function(elem) {
        return {
            "stat": elem.getElementsByClassName("skill-item-stat")[0]
                        .textContent
                        .replace(/\(/g, "")
                        .replace(/\)/g, ""),
            "name": elem.getElementsByClassName("skill-item-name")[0].textContent,
            "bonus": ddbparser.parseBonus(
                elem.getElementsByClassName("skill-item-modifier-extra")[0].textContent,
                elem.getElementsByClassName("skill-item-modifier-value")[0].textContent)
        };
    },

    // returns { name: string, value: int, mod: int, save: int }
    parseAbility: function(elem) {
        let modifier = elem.getElementsByClassName("character-ability-modifier")[0];
        let save = elem.getElementsByClassName("character-ability-save")[0];
        return {
            "name": elem.getElementsByClassName("character-ability-label")[0].textContent,
            "value": parseInt(elem.getElementsByClassName("character-ability-score")[0].textContent, 10),
            "mod": ddbparser.parseBonus(
                modifier.getElementsByClassName("character-ability-stat-extra")[0].textContent,
                modifier.getElementsByClassName("character-ability-stat-value")[0].textContent),
            "save": ddbparser.parseBonus(
                    save.getElementsByClassName("character-ability-stat-extra")[0].textContent,
                    save.getElementsByClassName("character-ability-stat-value")[0].textContent)
        };
    },

    registerSaveRolls: function() {
        let saves = document.getElementsByClassName("character-ability-row");
        for (var idx = 0; idx < saves.length; idx++) {
            let save = saves[idx];
            let ability = ddbparser.parseAbility(save);
            let target = save.getElementsByClassName("character-ability-save")[0];
            let roller = document.createElement("a");
            roller.href = "#";
            roller.onclick = function (e) { ddb.rollSave(e.currentTarget, ability); }
            target.parentNode.appendChild(roller);
            roller.appendChild(target);
        };
    },

    registerSkillRolls: function() {
        let skillItems = document.getElementsByClassName("skill-item");
        for (var idx = 0; idx < skillItems.length; idx++) {
            let skillItem = ddbparser.parseSkillItem(skillItems[idx]);
            let target = skillItems[idx].getElementsByClassName("skill-item-modifier")[0];
            let roller = document.createElement("a");
            roller.href = "#";
            roller.onclick = function (e) { ddb.rollSkill(e.currentTarget, skillItem); }
            target.parentNode.appendChild(roller);
            roller.appendChild(target);
        }
    }
};

var ddb = {
    
    rollSave: function(elem, ability) {
        let roll = ddbdice.roll_d20();
        alert("[" + ability.name + "] You rolled a " + roll + " + " + ability.save + " (bonus) = " + (roll + ability.save));
    },

    rollSkill: function (elem, skill) {
        let roll = ddbdice.roll_d20();
        alert("[" + skill.name + "(" + skill.stat + ")" + "] You rolled a " + roll + " + " + skill.bonus + " (bonus) = " + (roll + skill.bonus));
    },
    
    init: function() {
        ddbparser.registerSaveRolls();
        ddbparser.registerSkillRolls();
    },

    ensureLoaded: function() {
        // The DDB character sheet is late-loaded with React, so we need to wait until
        // it exists before executing our code.

        var loadedInterval;
        function isLoaded() {
            if (document.getElementsByClassName("loading-blocker").length == 0) {
                clearInterval(loadedInterval);
                ddb.init();
            }
        }

        loadedInterval = window.setInterval(isLoaded, 250);
    }
};

ddb.ensureLoaded();
console.log("discord beyond loaded...");
