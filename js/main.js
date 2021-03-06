(() => {
	class Item {
		constructor(id, rarity, key, name, tags, icon, description, info=undefined) {
			this.id = id;
			this.rarity = rarity;
			this.key = key;
			this.name = name;
			this.tags = tags;
			this.icon = icon;
			this.description = description;
			this.info = info;
			this.search = [
				this.rarity,
				this.name,
				this.tags,
				this.key,
				this.description
			].join(" ").toLowerCase();
			this.createCard();
			Item.list.appendChild(this.node);
		}

		/**
		 * {offense:} -> yellow
		 * {defense:} -> green
		 * {misc:} -> blue
		 * {debuff:} -> orange
		 * {$1} -> $1 per stack
		 */
		beautify(node, text) {
			// Normalize linebreak
			text = text.replace(/(\r?\n|\r)/gm, "\n");
			// Find tokens
			let specialNodes = [];
			let specialCount = 0;
			let lastTokenPos = 0;
			// Find strings that match tag
			let foundOpenPos, foundClosePos;
			while ((foundOpenPos = text.indexOf("{", lastTokenPos)) > -1) {
				foundOpenPos += 1; // Add the tag length to the found position
				// Find the closing tag
				if ((foundClosePos = text.indexOf("}", foundOpenPos)) > -1 && foundOpenPos != foundClosePos) {
					let foundResult = text.substring(foundOpenPos, foundClosePos);
					// Find the category
					let category = undefined;
					let foundCategoryPos = undefined;
					if ((foundCategoryPos = foundResult.indexOf(":")) > -1) {
						category = foundResult.substring(0, foundCategoryPos);
						foundResult = foundResult.substring(foundCategoryPos + 1);
					}
					// Add the found tag to the list
					specialNodes.push({
						text: foundResult,
						category: category
					});
					// Replace the string by a token \id\
					// Remove the tagLength from foundOpenPos to capture the tag
					// Add the tagLength to foundClosePos to also capture the tag
					let newText = text.substring(0, foundOpenPos - 1) + "[[$" + specialCount + "]]" + text.substring(foundClosePos + 1);
					text = newText;
					specialCount++;
				}
				// Update lastTokenPos to reduce the string length to search
				lastTokenPos = foundOpenPos;
			}
			if (specialNodes.length > 0) {
				let parts = text.split(/\[\[\$(\d+)\]\]/);
				let lastPart = parts.length;
				for (let i = 0; i < lastPart; i++) {
					// even index is simple text
					if (i % 2 == 0) {
						node.appendChild(document.createTextNode(parts[i]));
					} else {
						let specialInfo = specialNodes[Math.floor(parts[i])];
						let specialNode = document.createElement("span");
						if (specialInfo.category == undefined) {
							specialNode.className = "is-stackable";
							specialNode.textContent = ["(", specialInfo.text, " per stack)"].join("");
						} else {
							specialNode.className = ["is-", specialInfo.category].join("");
							specialNode.textContent = specialInfo.text;
						}
						node.appendChild(specialNode);
					}
				}
			} else {
				node.textContent = text;
			}
		}

		createCard() {
			this.node = document.createElement("div");
			this.node.className = "column is-one-third-widescreen is-half-desktop is-full-touch";
			let card = document.createElement("div");
			card.className = ["card is-", this.rarity].join("");;
			// header
			let header = document.createElement("header");
			header.className = "card-header";
			let name = document.createElement("h1");
			name.className = "card-header-title is-size-4";
			name.title = this.name;
			name.textContent = this.name;
			let itemID = document.createElement("span");
			itemID.className = "card-header-icon is-hidden-touch";
			itemID.textContent = ['#', this.id].join('');
			// Content
			let content = document.createElement("div");
			content.className = "card-content";
			let columns = document.createElement("div");
			columns.className = "columns is-mobile is-marginless";
			let imageColumn = document.createElement("div");
			imageColumn.className = "column is-paddingless is-narrow is-item-image";
			let imageSrc = ["img/", this.icon, ".png"].join("");
			let image = document.createElement("img");
			image.src = imageSrc;
			image.width = 90;
			image.height = 90;
			image.title = "Click to copy give command";
			image.addEventListener("click", event => {
				let give = "give_item";
				if (this.rarity == 5 ||
					(this.rarity == 4 && Item.LUNAR_EQUIPMENTS.indexOf(this.id) >= 0)) {
					give = "give_equip";
				}
				navigator.clipboard.writeText([give, " ", this.id, " 1"].join(""))
					.then(() => {
						SimpleNotification.success("Copied", ["**", this.name, "** give command has been copied."].join(""), imageSrc, { duration: 1200, position: "bottom-left" });
					})
					.catch(error => {
						SimpleNotification.error("Error", ["Could not copy the give command:\n", error].join(""), imageSrc, { duration: 1200, position: "bottom-left" });
					});
			});
			let descriptionColumn = document.createElement("div");
			descriptionColumn.className = "column is-item-description";
			this.beautify(descriptionColumn, this.description);
			if (this.info != undefined) {
				let unlockDescription = document.createElement("div");
				unlockDescription.className = "is-unlock-description";
				unlockDescription.textContent = [this.info, "\nClick to hide."].join("");
				unlockDescription.addEventListener("click", event => {
					unlockDescription.classList.toggle("is-shown");
				});
				content.appendChild(unlockDescription);
				let unlockButton = document.createElement("button");
				unlockButton.className = "button is-primary is-small is-fullwidth";
				unlockButton.textContent = "Show Unlock";
				unlockButton.addEventListener("click", event => {
					unlockDescription.classList.toggle("is-shown");
				});
				descriptionColumn.appendChild(unlockButton);
			}
			// Append
			header.appendChild(name);
			header.appendChild(itemID);
			content.appendChild(columns);
			columns.appendChild(imageColumn);
			imageColumn.appendChild(image);
			columns.appendChild(descriptionColumn);
			content.appendChild(columns);
			card.appendChild(header);
			card.appendChild(content);
			this.node.appendChild(card);
		}
	}
	Item.list = document.getElementById('items');
	Item.RARITY = {
		COMMON: 'common',
		UNCOMMON: 'uncommon',
		RARE: 'rare',
		UNIQUE: 'unique',
		LUNAR: 'lunar',
		EQUIPMENT: 'equipment'
	};
	Item.LUNAR_EQUIPMENTS = [3, 23, 26];
	let itemObjects = [
		new Item(0, Item.RARITY.COMMON, 'Syringe', 'Soldier\'s Syringe', 'offense,speed', 'syringe', 'Increase {offense:Attack Speed} by {offense:15%} {+15%}.'),
		new Item(1, Item.RARITY.COMMON, 'Bear', 'Tougher Times', 'defense,block,locked', 'bear', '{defense:15%} {+15%} chance to {defense:block} incoming damage.\n{misc:Unaffected by the luck}.', 'Die 5 times.'),
		new Item(6, Item.RARITY.COMMON, 'Tooth', 'Monster Tooth', 'defense,heal,on,kill', 'monsterTooth', 'Killing an ennemy spawns a {defense:healing orb} that {defense:heals} for {defense:6} {+6} {defense:health}.'),
		new Item(7, Item.RARITY.COMMON, 'CritGlasses', 'Lens-Maker\'s Glasses', 'offense,critical,chance', 'glasses', 'Your attacks have a {offense:10%} {+10%} chance to \'{offense:Critically Strike}\', dealing {offense:double damage}.'),
		new Item(8, Item.RARITY.COMMON, 'Hoof', 'Paul\'s Goat Hoof', 'defense,movespeed,locked', 'goat', 'Increases {misc:movement speed} by {misc:14%} {+14%}.', 'Fail the Shrine of chance 3 times in a row.'),
		new Item(16, Item.RARITY.COMMON, 'Mushroom', 'Bustling Fungus', 'defense,heal,stand', 'fungus', 'After standing still for {defense:2} seconds create a zone that {defense:heals} for {defense:4.5%} {+2.25%} of your {defense:health} every second to all allies within {defense:3m} {+1.5m}.'),
		new Item(17, Item.RARITY.COMMON, 'Crowbar', 'Crowbar', 'attack', 'crowbar', 'Deal {offense:150%} {+30%} damage to enemies above {offense:90% health}.', 'Discover 10 unique white items.'),
		new Item(20, Item.RARITY.COMMON, 'BleedOnHit', 'Trip-Tip Dagger', 'offense,dot', 'tritip', '{offense:15%} {+15%} chance to {offense:bleed} an enemy for {offense:240%} base damage.'),
		new Item(24, Item.RARITY.COMMON, 'LevelBonus', 'Warbanner', 'utility,attack,speed,movespeed,on,level', 'warbanner', 'On {misc:level up} drop a banner that strengthens all allies within {misc:16m} {+8m}.\nRaise {offense:attack} and {misc:movement speed} by {offense:30%}.'),
		new Item(27, Item.RARITY.COMMON, 'HealWhileSafe', 'Cautious Slug', 'defense,heal', 'slug', 'Increases {defense:passive health regeneration} by {defense:250%} {150%} while outside of combat.'),
		new Item(29, Item.RARITY.COMMON, 'PersonalShield', 'Personal Shield Generator', 'defense,shield', 'shield', 'Gain a {defense:25} {+25} {defense:health shield}.\nRecharges outside of danger.'),
		new Item(36, Item.RARITY.COMMON, 'Medkit', 'Medkit', 'defense,heal,on,hit,locked', 'medkit', '{defense:Heal} for {defense:10} {+10} {defense:health} 1.1 seconds after getting hurt.', 'Defeat an Elite-type monster.'),
		new Item(39, Item.RARITY.COMMON, 'IgniteOnKill', 'Gasoline', 'offense,fire,on,kill', 'gasoline', 'Killing an enemy {offense:ignites} all enemies within {offense:12m} {+4}.\nEnnemies {offense:burn} for {offense:150%} {+75%} base damage.'),
		new Item(41, Item.RARITY.COMMON, 'StunChanceOnHit', 'Stun Grenade', 'offense,stun,on,hit', 'stunGrenade', '{misc:5%} {+5%} chance on hit to {misc:stun} enemies for {misc:2} seconds.'),
		new Item(42, Item.RARITY.COMMON, 'Firework', 'Bundle of Fireworks', 'offense,on,open,locked', 'firework', 'Opening a chest {offense:launches 8} {+4} {offense:fireworks} that deal {offense:300%} base damage.', 'Duplicate the same item 7 times in a row with a 3D printer.'),
		new Item(57, Item.RARITY.COMMON, 'SprintBonus', 'Energy Drink', 'defense,movespeed', 'drink', '{misc:Sprint speed} is improved by {misc:30%} {+20%}.'),
		new Item(58, Item.RARITY.COMMON, 'SecondarySkillMagazine', 'Backup Magazine', 'utility,charge,locked', 'backupMag', 'Add {misc:+1} {+1} charge of your {misc:Secondary skill}.', 'Fully charge a Teleporter without getting hit.'),
		new Item(59, Item.RARITY.COMMON, 'StickyBomb', 'Sticky Bomb', 'offense,on,hit', 'stickyBomb', '{offense:5%} {+2.5%} chance on hit to attach a {offense:bomb} to an enemy, detonating for {offense:180%} TOTAL damage.'),
		new Item(60, Item.RARITY.COMMON, 'TreasureCache', 'Rusted Key', 'utility,box,locked', 'key', 'A {misc:hidden cache} containing an item will appear in a random location {misc:on each stage} {Increase rarity of the item}.', 'Defeat the Teleporter boss under 15 seconds.'),
		new Item(61, Item.RARITY.COMMON, 'BossDamageBonus', 'Armor-Piercing Rounds', 'offense,boss,ammo,bullet,locked', 'bossDamage', 'Deal an additional {offense:20%} damage {+10%} to bosses.', 'Complete a Teleporter event.'),
		new Item(78, Item.RARITY.COMMON, 'ExecuteLowHealthElite', 'Old Guillotine', 'offense,boss,locked', 'guillotine', 'Instantly kill Elite Monsters below {debuff:20%} {+5%} {debuff:health}.', 'Defeat 500 Elite Monsters.'),
		new Item(84, Item.RARITY.COMMON, 'BarrierOnKill', 'Topaz Brooch', 'defense,shield,on,kill', 'shieldBrooch', 'Gain a {defense:temporary barrier} on kill for {defense:20 health} {+20}.'),
		new Item(87, Item.RARITY.COMMON, 'NearbyDamageBonus', 'Focus Crystal', 'offense,closen,boost,damage', 'redCrystal', 'Increase damage to enemies withing {offense:13m} by {offense:15%} {+15%}.'),
		new Item(91, Item.RARITY.COMMON, 'RegeOnKill', 'Fresh Meat', 'utility,heal,steack,steak,raw,health', 'steak', 'Increase {defense:base health regeneration} by {offense:+2% hp/s} for {misc:3s} {+3s} after killing an ennemy.'),
		new Item(3, Item.RARITY.UNCOMMON, 'Missile', 'AtG Missile Mk. 1', 'offense,on,hit', 'missile_mk', '{offense:10%} chance to fire a missile that deals {offense:300%} {+300%} damage.'),
		new Item(4, Item.RARITY.UNCOMMON, 'ExplodeOnDeath', 'Will-O\'-the-wisp', 'offense,on,kill', 'wisp', 'On killing an enemy, spawn a {offense:lava pillar} in a {offense:12m} {+2.4m} radius for {offense:350%} {+280%} base damage.'),
		new Item(9, Item.RARITY.UNCOMMON, 'Feather', 'Hopoo Feather', 'utility', 'feather', 'Gain {misc:+1} {+1} maximum {misc:jump count}.'),
		new Item(11, Item.RARITY.UNCOMMON, 'ChainLightning', 'Ukulele', 'offense,on,hit', 'ukulele', '{offense:25%} chance to fire a {offense:chain lightning} for {offense:80%} TOTAL damage up to {offense:3} {+2} targets within {offense:20m} {+2m}.'),
		new Item(13, Item.RARITY.UNCOMMON, 'Seed', 'Leeching Seed', 'defense,heal,on,hit', 'seed', 'Dealing damage {defense:heals} you for {defense:1} {+1} {defense:health}.'),
		new Item(19, Item.RARITY.UNCOMMON, 'AttackSpeedOnCrit', 'Predatory Instincts', 'offense,critical,locked', 'hat', '{offense:Critical Strikes} increase {offense:attack speed} by {offense:10%}.\nMaximum cap of {offense:30%} {+30%} {offense:attack speed}.', 'Reach +200% attack speed.'),
		new Item(21, Item.RARITY.UNCOMMON, 'SprintOutOfCombat', 'Red Whip', 'defense,movespeed', 'whip', 'Leaving combat boosts {misc:movement speed} by {misc:30%} {+30%}.'),
		new Item(25, Item.RARITY.UNCOMMON, 'Phasing', 'Old War Stealthkit', 'defense,phasing,invincible', 'phasing', 'Chance on taking damage to gain {misc:40% movement speed} and {misc:invisibility} for {misc:3s} {+1.5s}.\nChance increases the more damage you take.'),
		new Item(26, Item.RARITY.UNCOMMON, 'HealOnCrit', 'Harvester\'s Scythe', 'offense,defense,critical,heal,locked', 'scythe', 'Gain {offense:5% critical chance}.\n{offense:Critical strikes} {defense:heal} for {defense:8} {+4} {defense:health}.', 'Complete a Prismatic Trial.'),
		new Item(30, Item.RARITY.UNCOMMON, 'EquipmentMagazine', 'Fuel Cell', 'utility,charge,locked', 'cell', 'Hold an {misc:additional equipment charge} {+1}.\n{misc:Reduce equipment cooldown} by {misc:15%} {+15%}.', 'Pickup 5 different types of Equipment.'),
		new Item(33, Item.RARITY.UNCOMMON, 'Infusion', 'Infusion', 'defense,life,locked', 'infusion', 'Killing an enemy increases your {defense:health permanently} by {defense:1}, up to a {defense:maximum} of {defense:100} {+100} {defense:health}.', 'Defeat 3000 enemies.'),
		new Item(37, Item.RARITY.UNCOMMON, 'Bandolier', 'Bandolier', 'utility', 'bandolier', '{misc:18%} {+10%} chance on kill to drop an ammo pack that {misc:resets all cooldowns}.'),
		new Item(46, Item.RARITY.UNCOMMON, 'WarCryOnMultiKill', 'Berzerker\'s Pauldron', 'offense,movespeed,on,kill,locked', 'berzerk', '{offense:Killing 3 enemies} within {offense:1} second sends you into a {offense:frenzy} for {offense:6s} {+4s}.\nIncreases {misc:movement speed} by {misc:50%} and {offense:attack speed} by {offense:100%}.', 'Charge the Teleporter with less than 10% health.'),
		new Item(62, Item.RARITY.UNCOMMON, 'SprintArmor', 'Rose Buckler', 'defense,armour,shield', 'buckler', '{defense:Increase armor} by {defense:25} {+25} while {misc:sprinting}.'),
		new Item(63, Item.RARITY.UNCOMMON, 'IceRing', 'Runald\'s Band', 'offense,on,hit,locked', 'iceRing', '{offense:8%} chance on hit to strike an ennemy with a {offense:runic ice blast}, {misc:slowing} them by {misc:80%} and dealing {offense:250%} TOTAL damage {+125%}.', 'Discover the hidden chamber in the Abandonned Aqueduct.'),
		new Item(64, Item.RARITY.UNCOMMON, 'FireRing', 'Kjaro\'s Band', 'offense,on,hit,locked', 'fireRing', '{offense:8%} chance on hit to strike an ennemy with a {offense:runic flame tornado}, dealing {offense:500%} TOTAL damage {+250%}.', 'Discover the hidden chamber in the Abandonned Aqueduct.'),
		new Item(65, Item.RARITY.UNCOMMON, 'SlowOnHit', 'Chronobauble', 'offense,on,hit', 'bauble', '{misc:Slow} enemies for {misc:-60% movement speed} for {misc:2s} {+2s}.'),
		new Item(76, Item.RARITY.UNCOMMON, 'JumpBoost', 'Wax Quail', 'defense,movespeed,pigeon,locked', 'quail', '{defense:Jumping} while {defense:sprinting} boosts you forward by {defense:10m} {+10m}.', 'Reach +300% movespeed (include sprinting).'),
		new Item(79, Item.RARITY.UNCOMMON, 'EnergizedOnEquipmentUse', 'War Horn', 'offense,attack,speed,equipment,locked', 'warHorn', 'Activating your Equipment gives you {offense:+70% attack speed} for {offense:8s} {+4s}.', 'Complete 3 Combat Shrines in a single stage.'),
		new Item(86, Item.RARITY.UNCOMMON, 'TPHealingNova', 'Lepton Daisy', 'defense,heal,flower', 'healFlower', 'Release a {defense:healing nova} during the Teleporter event, {defense:healing} all nearby allies for {defense:50%} of their maximum health. Occurs {defense:1} {+1} times.'),
		new Item(90, Item.RARITY.UNCOMMON, 'Thorns', 'Razorwire', 'offense,on,hit,radius,new', 'razorHeadband', 'Getting hit causes you to explode in a burst of razors, dealing {offense:160% damage}.\nHits up to {offense:5} {+2} targets in a {offense:25m} {+10m} radius.'),
		new Item(94, Item.RARITY.UNCOMMON, 'BonusGoldPackOnKill', 'Ghor\'s Tome', 'utility,gold,book,treasure,flesh,new', 'goldBook', '{misc:4%} {+4%} chance on kill to drop a treasure worth {misc:25$}. {misc:Scales over time.}'),
		new Item(2, Item.RARITY.RARE, 'Behemoth', 'Brilliant Behemoth', 'offense,explosion,on,hit', 'behemoth', 'All your {offense:attacks explode} in a {offense:4m} {+1.5m} radius for a bonus {offense:60%} TOTAL damage to nearby enemies.'),
		new Item(5, Item.RARITY.RARE, 'Dagger', 'Ceremonial Dagger', 'offense,on,kill,tracking,attack', 'dagger', 'Killing an enemy fires out {offense:3 homing daggers} that deal {offense:150%} {+150%} base damage.'),
		new Item(14, Item.RARITY.RARE, 'Icicle', 'Frost Relic', 'offense,on,kill', 'ice', 'Killing an enemy surrounds you with an {offense:ice storm} that deals {offense:600% damage per second}.\nThe storm {offense:grows with every kill}, increasing it\'s radius by {offense:1m}.\nStacks up to {offense:6m} {+6m}.'),
		new Item(15, Item.RARITY.RARE, 'GhostOnKill', 'Happiest Mask', 'offense,on,kill', 'mask', 'Killing enemies has a {offense:10%} chance to {offense:spawn a ghost} of the killed enemy with {offense:500%} damage. Lasts {offense:30s} {+30s}.'),
		new Item(22, Item.RARITY.RARE, 'FallBoots', 'H3AD-5T v2', 'defense,attack,fall', 'cuffs', 'Increase {misc:jump height}.\nCreates a {offense:10m} radius {offense:kinetic explosion} on hitting the ground, dealing {offense:2300%} base damage that scales up with {offense:speed}.\nRecharges in {offense:10} {-50%} seconds.'),
		new Item(31, Item.RARITY.RARE, 'NovaOnHeal', 'N\'kuhana\'s Opinion', 'offense,locked', 'opinion', 'Store {defense:100%} {+100%} of healing as {defense:Soul Energy}.\nAfter your {defense:Soul Energy} reaches {defense:10%} of your {defense:maximum health}, {offense:fire a skull} that deals {offense:250%} of your {defense:Soul Energy} as {offense:damage}.', 'Find the Altar to N\'kuhana.'),
		new Item(32, Item.RARITY.RARE, 'ShockNearby', 'Unstable Tesla Coil', 'offense,close,locked', 'tesla', 'Fire out {offense:lightning} that hits {offense:3} {+3} enemies for {offense:200%} base damage every {offense:0.5s}.\nThe Tesla Coil switches off every {offense:10 seconds}.', 'Deal 5000 damage in one shot.'),
		new Item(35, Item.RARITY.RARE, 'Clover', '57 Leaf Clover', 'utility,locked', 'clover', 'All random effects are rolled {misc:+1} {+1} {misc:times for a favorable outcome}.', 'Complete 20 stages in a single run.'),
		new Item(38, Item.RARITY.RARE, 'BounceNearby', 'Sentient Meat Hook', 'offense,utility,grab,locked', 'hook', '{offense:20%} {+20%} chance on hit to {offense:fire homing hooks} at up to {offense:10} {+5} enemies for {offense:100%} TOTAL damage.', 'Loop back to the first stage.'),
		new Item(50, Item.RARITY.RARE, 'AlienHead', 'Alien Head', 'utility', 'alien', '{misc:Reduce skill cooldown} by {misc:25%} {+25%}.'),
		new Item(51, Item.RARITY.RARE, 'Talisman', 'Souldbound Catalyst', 'utility,equipment,locked', 'soul', '{offense:Kills reduce} {misc:equipment cooldown} by {misc:4s} {+2s}.', 'Discover and activate 8 unique Newt Altars.'),
		new Item(66, Item.RARITY.RARE, 'ExtraLife', 'Dio\'s Best Friend', 'utility,bear,death,jojo,revive,res,locked', 'dio', '{misc:Upon Death}, this item will be {misc:consumed} and you will {defense:return to life} with {defense:3 seconds of invulnerability}.', 'Stay alive for 30 consecutive minutes.'),
		new Item(68, Item.RARITY.RARE, 'UtilitySkillMagazine', 'Hardlight Afterburner', 'utility,charge',  'burner', 'Add {misc:+2} {+2} charges of your {misc:Utility skill}.\n{misc:Reduces Utility skill cooldown} by {misc:33%}.'),
		new Item(69, Item.RARITY.RARE, 'HeadHunter', 'Wake of Vultures', 'utility,elite,poe,headhunter', 'headhunter', 'Gain the {offense:power} of any killed elite monster for {offense:8s} {+5s}.'),
		new Item(70, Item.RARITY.RARE, 'KillEliteFrenzy', 'Brainstalks', 'offense,locked', 'brain', 'Upon killing an elite monster, {offense:enter a frenzy} for {offense:3s} {+2s} where {misc:skills have no cooldowns}.', 'Defeat an Elite boss on Monsoon difficulty.'),
		new Item(75, Item.RARITY.RARE, 'IncreaseHealing', 'Rejuvenation Rack', 'defense,heal,double,locked', 'horn', '{defense:Heal +100%} {+100%} more.', 'Without healing, reach and complete the 3rd Teleporter event.'),
		new Item(80, Item.RARITY.RARE, 'BarrierOnOverHeal', 'Aegis', 'utility,heal,defense', 'fullBarrier', 'Healing past full grants you a {defense:temporary barrier} for up to {defense:20%} {+20%} of your {defense:maximum health}.'),
		new Item(85, Item.RARITY.RARE, 'ArmorReductionOnHit', 'Shattering Justice', 'offense,armor,break,hammer,hit', 'hammer', 'After hitting an enemy {offense:5} times, reduce their {offense:armor} by {offense:60} for {offense:8} {+8} seconds.'),
		new Item(95, Item.RARITY.RARE, 'LaserTurbine', 'Resonance Disc', 'offense,charge,piercing,explode,new', 'disc', 'Killing enemies charges the Resonance Disc. The disc launches itself toward a target for {offense:300%} base damage {+300%}, piercing all enemies it doesn\'t kill, and then explodes for {offense:1000%} base damage {+1000%}.\nReturns to the user, striking all enemies along the way the for {offense:300%} base damage {+300%}.'),
		new Item(52, Item.RARITY.UNIQUE, 'Knurl', 'Titanic Knurl', 'defense,life', 'knurl', '{defense:Increases maximum health} by {defense:40} {+40} and {defense:health regeneration} by {defense:1.6} {+1.6} {defense:health / second}.'),
		new Item(53, Item.RARITY.UNIQUE, 'BeetleGland', 'Queen\'s Gland', 'utility,invocation', 'beetle', 'Every 30 seconds, {misc:summon a Beetle Guard} with bonus {offense:300%} damage and {defense:100%} health.\nCan have up to {misc:1} {+1} Guards at a time.'),
		new Item(82, Item.RARITY.UNIQUE, 'TitanGoldDuringTP', 'Halcyon Seed', 'utility,invocation,boss,summon', 'goldenSeed', 'Summon {offense:Aurelionite} during the teleporter event.\nIt has {offense:100%} {+50%} {offense:damage} and {defense:100%} {+100%} {defense:health}.'),
		new Item(83, Item.RARITY.UNIQUE, 'SprintWisp', 'Little Disciple', 'offense,tracking,sprint,attack', 'sprintingWisp', 'Fire a {offense:tracking wisp} for {offense:100%} {+100%} {offense:damage}.\nFires every 0.5 seconds while sprinting.'),
		new Item(92, Item.RARITY.UNIQUE, 'Pearl', 'Pearl', 'defense,health,maximum,new', 'pearl', 'Increases {defense:maximum health} by {defense:10%} {+10%}.'),
		new Item(93, Item.RARITY.UNIQUE, 'ShinyPearl', 'Irradiant Pearl', 'defense,boost,statistics,new', 'shinyPearl', 'Increases {misc:ALL stats} by {misc:10%} {+10%}.'),
		new Item(97, Item.RARITY.UNIQUE, 'NovaOnLowHealth', 'Genesis Loop', 'low,health,nova,explode,recharge,cooldown,new', 'weirdTail', 'Falling below {debuff:25% health} causes you to explode, dealing {offense:6000% base damage}. Recharges every {misc:30 seconds} {-50%}.'),
		new Item(43, Item.RARITY.LUNAR, 'LunarDagger', 'Shaped Glass', 'offense,suicide', 'sword', 'Increase base damage by {offense:100%} {+100%}.\n{defense:Reduce maximum health by 50%} {+50%}.'),
		new Item(44, Item.RARITY.LUNAR, 'GoldOnHit', 'Brittle Crown', 'utility', 'crown', '{misc:30% chance on hit} to gain {misc:3} {+3} {misc:gold}.\n{debuff:Lose gold} equal to {debuff:100%} {+100%} of amount your are hit for OR lose % gold equal to {debuff:100%} {+100%} of the maximum health % you lost.\nChooses the greater of the two.'),
		new Item(49, Item.RARITY.LUNAR, 'ShieldOnly', 'Transcendence', 'defense,chaos', 'transc', '{defense:Convert} all but {defense:1 health} into {defense:regenerating shields}.\n{defense:Gain 50%} {+25%} {defense:maximum health}.'),
		new Item(71, Item.RARITY.LUNAR, 'RepeatHeal', 'Corpsebloom', 'defense,heal,dot', 'flower', '{defense:Heal +100%} {+100%} more.\n{defense:All healing is applied over time}.\nCan {defense:heal} for a {defense:maximum} of {defense:10%} {-50%} of your {defense:health per second}.'),
		new Item(74, Item.RARITY.LUNAR, 'AutoCastEquipment', 'Gesture of the Drowned', 'utility,equipment,locked', 'fossil', '{misc:Reduce equipment cooldown} by {misc:50%} {+50%}.\nForces your Equipment to {misc:activate} whenever it is off {misc:cooldown}.', 'Kill 20 Hermit Crabs by chasing them off the edge of the map.'),
		new Item(88, Item.RARITY.LUNAR, 'LunarUtilityReplacement', 'Strides of Heresy', 'utility,movement,skill,arm,speed,heal,defense', 'weirdArm', '{misc:Replace your Utility Skill} with {misc:Shadowfade}.\nFade away, becoming {misc:intangible} and gaining {misc:+30% movement speed}. {defense:Heal} for {defense:25%} {+25%} {defense:of your maximum health}. Lasts 3 {+3} seconds.', 'Kill 15 boss monsters in a single run.'),
		new Item(96, Item.RARITY.LUNAR, 'LunarPrimaryReplacement', 'Visions of Heresy', 'active,primary,replace,offense,damage,recharge,cooldown,skill,orb,new', 'weirdOrb', '{misc:Replace your Primary Skill} with {misc:Hungering Gaze}.\nFire a flurry of {misc:tracking shards} that detonate after a delay, dealing {offense:120%} base damage. Hold up to 12 charges {+12} that reload after 2 seconds {+2}.'),
		new Item(98, Item.RARITY.LUNAR, 'LunarTrinket', 'Beads of Fealty', 'secret,unlock,zone,no,effect,new', 'beads', 'Seems to do nothing... {debuff:but...}', 'Unlock the new zone from the "Hidden Realms" update when you obliterate with this item.'),
		new Item(3, Item.RARITY.LUNAR, 'Meteor', 'Glowing Meteorite', 'offense,suicide,equipment,locked', 'meteorite', '{offense:Rain meteors} from the sky, damaging ALL characters for {offense:600% damage per blast}.\nLast 20 seconds.', 'Carry 5 Lunar items in a single run.'),
		new Item(23, Item.RARITY.LUNAR, 'BurnNearby', 'Helfire Tincture', 'offense,suicide,fire,equipment,locked', 'burn', 'Ignite ALL characters within 8m. Deal {offense:5% of your maximum health/second as burning} to yourself.\nThe burn is {offense:0.5x} stronger on allies, and {offense:24x} stronger on enemies.\nCooldown: {misc:45s}', 'Kill 15 enemies simultaneously.'),
		new Item(26, Item.RARITY.LUNAR, 'CrippleWard', 'Effigy of Grief', 'utility,equipment', 'slow', 'ALL characters are {misc:slowed by 50%} and has their {offense:armor reduced by 20}.\nCooldown: {misc:45s}'),
		new Item(28, Item.RARITY.LUNAR, 'Tonic', 'Spinel Affliction', 'utility,buff,debuff,attack,speed,movespeed,health,regen', 'tonic', 'Drink the Tonic, gaining a boost for 15 seconds.\nIncreases {offense:damage} by {offense:+100%}.\nIncreases {offense:attack speed} by {offense:+70%}.\nIncreases {offense:armor} by {offense:+20}.\nIncreases {defense:maximum health} by {defense:+50%}.\nIncreases {defense:passive health regeneration} by {defense:+300%}.\nIncreases {misc:movespeed} by {misc:+30%}.\nWhen the tonic wears off, you have {debuff:20%} chance to gain a {debuff:Tonic Affliction, reducing all of your stats} by {debuff:-5%} {-5%}', 'Discover and enter three unique portals.'),
		new Item(0, Item.RARITY.EQUIPMENT, 'CommandMissile', 'Disposable Missile Launcher', 'attack', 'missile', 'Fire a swarm of {offense:12} missiles that deal {offense:12x300%} damage.\nCooldown: {misc:45s}'),
		new Item(2, Item.RARITY.EQUIPMENT, 'Fruit', 'Foreign Fruit', 'defense,heal', 'fruit', 'Instantly heal for {defense:50% of your maximum health}.\nCooldown: {misc:45s}'),
		new Item(11, Item.RARITY.EQUIPMENT, 'Blackhole', 'Blackhole', 'offense,stack', 'blackhole', 'Fire a black hole that {misc:draws enemies within 30m into it\'s center}.\nLast 10 seconds.\nCooldown: {misc:60s}'),
		new Item(13, Item.RARITY.EQUIPMENT, 'CritOnUse', 'Ocular HUD', 'attack', 'hud', 'Gain {offense:+100% Critical Strike Chance} for 8 seconds.\nCooldown: {misc:60s}'),
		new Item(14, Item.RARITY.EQUIPMENT, 'DroneBackup', 'The Back-up', 'utility,locked', 'drone', 'Call {offense:4 Strike Drones} to fight for you.\nLast 25 seconds.\nCooldown: {misc:100s}', 'Repair 30 drones or turrets.'),
		new Item(16, Item.RARITY.EQUIPMENT, 'BFG', 'Preon Accumulator', 'offense,locked', 'beam', 'Fires preon tendrils, zapping enemies within 35m up to {offense:600% damage/second}.\nOn contact, detonate in an enormous 20m explosion for {offense:4000% damage}.\nCooldown: {misc:140s}', 'Open the Timed Security Chest on Rallypoint Delta.'),
		new Item(18, Item.RARITY.EQUIPMENT, 'Jetpack', 'Milky Chrisalis', 'utility,movespeed', 'larva', 'Sprout wings and {misc:fly for 15 seconds}.\nGain {misc:+20% movement speed} for the duration.\nCooldown: {misc:60s}'),
		new Item(19, Item.RARITY.EQUIPMENT, 'Lightning', 'Royal Capacitor', 'offense,locked', 'lightning', 'Call down a lightning strike on a targeted monster, dealing {offense:3000% damage} and {offense:stunning} nearby monsters.\nCooldown: {misc:20s}', 'Defeat the Teleporter bosses after activating 2 Shrines of the Moutain.'),
		new Item(20, Item.RARITY.EQUIPMENT, 'GoldGat', 'The Crowdfunder', 'offense,troll,locked', 'gatling', 'Fires a continuous barrage that deals {offense:100% damage per bullet}.\nCosts $1 per bullet. Costs increases over time.\nCooldown: {misc:5s}', 'Collect $30,480 total gold.'),
		new Item(21, Item.RARITY.EQUIPMENT, 'PassiveHealing', 'Gnarled Woodsprite', 'defense,heal,locked', 'spirit', 'Gain a Woodsprite follower that heals for {defense:1.5% of your maximum health/second}.\nCan be sent to an ally to heal them for {defense:10% of their maximum health}.\nCooldown: {misc:15s}', 'Fully upgrade a Shrine of the Woods.'),
		new Item(25, Item.RARITY.EQUIPMENT, 'Scanner', 'Radar Scanner', 'utility,scan,locked', 'radar', '{misc:Reveal} all interactables within 500m for {misc:10 seconds}.\nCooldown: {misc:45s}', 'Collect 10 Monster or Environment Logs.'),
		new Item(27, Item.RARITY.EQUIPMENT, 'Gateway', 'Eccentric Vase', 'utility,scan,locked', 'vase', 'Create a {misc:quantum tunnel} of up to {misc:1000m} in length. Lasts 30 seconds.\nCooldown: {misc:100s}', 'Defeat the guardian of Gilded Coast without any beacons deactivating.'),
		new Item(30, Item.RARITY.EQUIPMENT, 'Cleanse', 'Blast Shower', 'utility,defense,cleanse,debuff', 'potThing', '{misc:Cleanse} all negative effects. Includes debuffs, damage over time, and nearby projectiles.\nCooldown: {misc:20s}', 'Die three fiery deaths'),
		new Item(31, Item.RARITY.EQUIPMENT, 'FireBallDash', 'Volcania Egg', 'utility,offense,detonate,movement', 'egg', 'Turn into a {offense:draconic fireball} for {offense:5} seconds. Deal {offense:500% damage} on impact.\nDetonates at the end for {offense:800% damage}.\nCooldown: {misc:30s}'),
		new Item(33, Item.RARITY.EQUIPMENT, 'GainArmor', 'Jade Elephant', 'utility,defense,resistance,armor,new', 'elephant', 'Gain {offense:500 armor} for {misc:5 seconds}.\nCooldown: {misc:45s}'),
		new Item(5, Item.RARITY.EQUIPMENT, 'AffixRed', 'Ifrit\'s Distinction', 'offense,fire,drop', 'fireAspect', 'Become an aspect of fire.', 'Drop from Fire Elite enemies.'),
		new Item(6, Item.RARITY.EQUIPMENT, 'AffixBlue', 'Silent Between Two Strikes', 'offense,lightning,drop', 'lightningAspect', 'Become an aspect of lightning.', 'Drop from Lightning Elite enemies.'),
		new Item(9, Item.RARITY.EQUIPMENT, 'AffixWhite', 'Her Biting Embrace', 'offense,ice,drop', 'iceAspect', 'Become an aspect of ice.', 'Drop from Ice Elite enemies.'),
		new Item(10, Item.RARITY.EQUIPMENT, 'AffixPoison', 'N\'kuhana\'s Retort', 'offense,malachite,debuff,heal', 'affixMalachite', 'Become an aspect of corruption.', 'Drop from Malachite Elite enemies.'),
		//new Item(32, Item.RARITY.EQUIPMENT, 'AffixHaunted', 'Affix Haunted', 'utility,defense,haunted,elite,drop', 'whiteSquare', 'Become an haunted aspect.\n{misc:(No in-game image yet)}', 'Drop from Haunter Elite enemies.'),
		new Item(29, Item.RARITY.EQUIPMENT, 'QuestVolatileBattery', 'Fuel Array', 'quest', 'fuelArray', 'Looks like it could power something.\n{offense:EXTREMELY unstable...}.\n{misc:(Not obtainable in-game, used for quest)}'),
	];
	let itemObjectsCount = itemObjects.length;
	let noResult = document.getElementById("noResult");

	function search(query) {
		query = query.trim().toLowerCase();
		if (query == "") {
			Item.list.querySelectorAll(".is-hidden").forEach(element => {
				element.classList.remove("is-hidden");
			});
			noResult.classList.add("is-hidden");
			return;
		}
		let count = 0;
		for (let i = 0; i < itemObjectsCount; i++) {
			let item = itemObjects[i];
			if (item.search.indexOf(query) < 0) {
				item.node.classList.add("is-hidden");
			} else {
				count++;
				item.node.classList.remove("is-hidden");
			}
		}
		if (count == 0) {
			noResult.classList.remove("is-hidden");
		} else {
			noResult.classList.add("is-hidden");
		}
	}

	document.getElementById("search").addEventListener("input", event => {
		search(event.target.value);
	});
	document.getElementById("form").addEventListener("submit", event => {
		event.preventDefault();
		search(event.target.query.value);
	});
	document.getElementById("form").addEventListener("reset", () => {
		search("");
	});
})();