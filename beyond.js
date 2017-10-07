// For any future contributors:
//
// DDB character sheets are bound to change the structure over time so in
// order to prevent having to re-write the entire extension each time, the
// parsing code is separated out. If you make a pull request that contains
// any direct element usage in the non-parsing code, it will be rejected.

function sanitize(url) {
    return url.split("#").pop().split("?").pop();
}

function getSavedWebhook(callback) {
    chrome.storage.sync.get((items) => {
      callback(chrome.runtime.lastError ? null : items[sanitize(window.location.href)]);
    });
}

var discord = {
    post: function(options) {
        var payload = {
            "embeds": [options]
        };
        getSavedWebhook((webhook) => {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", webhook, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify(payload));
        });
    }
};

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

    parseInitiative: function(elem) {
        return parseInt(elem.innerText, 10);
    },

    createRoller: function(target, onclick) {
        target.onclick = onclick;
        target.style.cursor = "pointer";
    },

    registerAbilityRolls: function() {
        function registerCheck(elem, ability) {
            let target = elem.getElementsByClassName("character-ability-modifier")[0].getElementsByClassName("character-ability-stat-value")[0];
            ddbparser.createRoller(target, function (e) { ddb.rollCheck(e.currentTarget, ability); } );
        };

        function registerSave(elem, ability) {
            let target = elem.getElementsByClassName("character-ability-save")[0].getElementsByClassName("character-ability-stat-value")[0];
            ddbparser.createRoller(target, function (e) { ddb.rollSave(e.currentTarget, ability); } );
        };

        let abilities = document.getElementsByClassName("character-ability-row");
        for (var idx = 0; idx < abilities.length; idx++) {
            let elem = abilities[idx];
            let ability = ddbparser.parseAbility(elem);
            registerCheck(elem, ability);
            registerSave(elem, ability);
        };
    },

    registerSkillRolls: function() {
        let skillItems = document.getElementsByClassName("skill-item");
        for (var idx = 0; idx < skillItems.length; idx++) {
            let skillItem = ddbparser.parseSkillItem(skillItems[idx]);
            let target = skillItems[idx].getElementsByClassName("skill-item-modifier")[0].getElementsByClassName("skill-item-modifier-value")[0];
            ddbparser.createRoller(target, function (e) { ddb.rollSkill(e.currentTarget, skillItem); } );
        }
    },

    registerInitiativeRoll: function() {
        let target = document.getElementsByClassName("quick-info-initiative")[0].getElementsByClassName("quick-info-item-value")[0];
        let bonus = ddbparser.parseInitiative(target);
        ddbparser.createRoller(target, function (e) { ddb.rollInitiative(e.currentTarget, bonus); } );
    }
};

var ddb = {

    characterName: function() {
        return document.getElementsByClassName("character-info-name")[0].textContent;
    },

    format: function(roll, mod) {
        return "1d20 (" + roll + ") + " + mod + " = " + (roll + mod)
    },
    
    rollCheck: function(elem, ability) {
        let roll = ddbdice.roll_d20();
        var message = {
            "title": ddb.characterName() + " makes a " + ability.name + " check",
            "color": 6579300,
            "description": "Check: " + ddb.format(roll, ability.mod)
        };
        discord.post(message);
    },

    rollSave: function(elem, ability) {
        let roll = ddbdice.roll_d20();
        var message = {
            "title": ddb.characterName() + " makes a " + ability.name + " save",
            "color": 6579300,
            "description": "Save: " + ddb.format(roll, ability.save)
        };
        discord.post(message);
    },

    rollSkill: function (elem, skill) {
        let roll = ddbdice.roll_d20();
        var message = {
            "title": ddb.characterName() + " makes a " + skill.name + " check",
            "color": 6579300,
            "description": "Check: " + ddb.format(roll, skill.bonus)
        };
        discord.post(message);
    },
    
    rollInitiative: function (elem, bonus) {
        let roll = ddbdice.roll_d20();
        var message = {
            "title": ddb.characterName() + " makes an Initiative roll",
            "color": 6579300,
            "description": "Initiative: " + ddb.format(roll, bonus)
        };
        discord.post(message);
    },

    init: function() {
        ddbparser.registerAbilityRolls();
        ddbparser.registerSkillRolls();
        ddbparser.registerInitiativeRoll();
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
