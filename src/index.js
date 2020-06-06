'use strict'
// @ts-check
/* eslint-disable no-multiple-empty-lines */

// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Imports and global variables

/* eslint-disable indent */
const Discord = require('discord.js')
  const client = new Discord.Client()
require('dotenv').config()
const admin = require('firebase-admin')
  admin.initializeApp()
  const db = admin.firestore()
const Express = require('express')
  const app = Express()
const https = require('https')
const moment = require('moment-timezone')
/* eslint-enable indent */

const RANKS = {
  'ANY MIN': 0,

  'IRON 1': 11,
  'IRON 2': 12,
  'IRON 3': 13,

  'BRONZE 1': 21,
  'BRONZE 2': 22,
  'BRONZE 3': 23,

  'SILVER 1': 31,
  'SILVER 2': 32,
  'SILVER 3': 33,

  'GOLD 1': 41,
  'GOLD 2': 42,
  'GOLD 3': 43,

  'PLATINUM 1': 51,
  'PLATINUM 2': 52,
  'PLATINUM 3': 53,

  'DIAMOND 1': 61,
  'DIAMOND 2': 62,
  'DIAMOND 3': 63,

  'IMMORTAL 1': 71,
  'IMMORTAL 2': 72,
  'IMMORTAL 3': 73,

  'VALORANT': 81, // eslint-disable-line quote-props

  'ANY MAX': 99
}

const RANKS_REVERSED = {}
for (const key in RANKS) {
  const element = RANKS[key]
  RANKS_REVERSED[element] = key
}

const MAPS = ['split', 'bind', 'haven', 'ascent']
const MAPS_THUMBNAILS = {
  split: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt2caea7a88362d6aa/5ecd64b0817e574fa1dcc162/split-minimap-2.png',
  bind: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltad4274632c983531/5ecd64d04d187c101f3f2486/bind-minimap-2.png',
  haven: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltedb5d57941e4f3f5/5ecd64c14d187c101f3f2484/haven-minimap-2.png',
  ascent: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt47bef6aa9e43d8ec/5ecd64df96a8996de38bbf8f/ascent-minimap-2.jpg'
}
const AFFIRMATIVE_WORDS = ['yes', 'yeah', 'sure', 'true', '1', 'si', 'yea', 'ok', 'mhm', 'k']

class ScrimBotEmbed extends Discord.MessageEmbed {
  constructor (specialColor) {
    super()
    this.setColor(specialColor || 'PURPLE')
    this.footer = { text: 'Sponsored by Limitless Gaming', iconURL: 'https://cdn.discordapp.com/icons/667553378607431681/0129a1e3f29b541b6af45c8c3fb0dd14.webp' }
  }

  setFooter (text, override) {
    if (override) {
      this.footer.text = text
    }
    this.footer.text += `\n${text}`
  }
}








// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Heroku init

app.set('port', (process.env.PORT || 12500))

app.get('/', function (request, response) {
  response.send('Hey')
}).listen(app.get('port'), function () {
  console.log(`ScrimBot Initialized | Running on port ${app.get('port')}`)
})

setInterval(() => {
  https.get('https://valorant-scrim-bot.herokuapp.com')
}, 5 * 60 * 1000) // 5 minutes in milliseconds










// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Special message capturing

const activeUserRegistration = new Discord.Collection()
const userRegistrationSteps = [
  ['1. Valorant Username', 'What is your FULL Valorant username (including tag)?'],
  ['2. Valorant Rank', 'What rank are you in Valorant? If you don\'t have a rank, go with "Iron 1"'],
  ['3. Notifications', 'Do you want to be notified when LFG starts? Respond "yes" if you would like to opt-in.']
]

const activeMatchCreation = new Discord.Collection()
const matchCreationSteps = [
  ['1. Date & Time', 'When will the match be? Respond in the format HH:MM am/pm YYYY-MM-DD (If no date is specified the current day is assumed.)'],
  ['2. Rank Minimum', 'What is the **MINIMUM** rank you are allowing into your tournament? If any, type "any"'],
  ['3. Rank Maximum', 'What is the **MAXIMUM** rank you are allowing into your tournament? If any, type "any"'],
  ['4. Player Count', 'How many players should be on each team? Max 5.'],
  ['5. Spectators', 'Are spectators allowed?'],
  ['6. Map', 'Which map would you like to play on? Respond 1 for Split, 2 for Bind, 3 for Haven, 4 for Ascent. If any, type "any"']
]

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! All systems online.`)
  client.user.setActivity('for matches | v!help', { type: 'WATCHING' })
  addOldMessagesToCache()
})

// const rotateStatus = async () => {
//   const timeBetween = 15000
//   while (true) {
//     client.user.setActivity('for matches | v!help', { type: 'WATCHING' })
//     await new Promise(resolve => setTimeout(resolve, timeBetween))
//     client.user.setActivity('thanks to Limitless Gaming')
//     await new Promise(resolve => setTimeout(resolve, timeBetween))
//   }
// }









// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Command handling

client.on('message', async message => {
  if (message.author === client.user || message.author.bot === true) return // ignore messages from the bot itself or other bots
  if (activeUserRegistration.has(message.author.id)) {
    handleUserRegistration(activeUserRegistration.get(message.author.id), message)
    return
  }
  if (activeMatchCreation.has(message.author.id)) {
    handleMatchCreation(activeMatchCreation.get(message.author.id), message)
    return
  }

  /* eslint-disable brace-style */
  if (message.content === 'v!register') {
    const existingRecord = await db.collection('users').doc(message.author.id).get()
      .catch(console.error)
    if (existingRecord.exists) {
      message.reply('You have already registered!')
      return
    }

    const embed = new ScrimBotEmbed()
      .setTitle('ScrimBot Registration')
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setDescription('Welcome to ScrimBot! We will ask you a set of questions to get started. At any time, you can cancel by reacting with the x below. You can either respond to these questions in the current channel or through DMs with the bot.')
      .addField(userRegistrationSteps[0][0], userRegistrationSteps[0][1])
    await message.author.createDM()
    message.author.send(embed)
      .then(async registrationMessage => {
        const botReaction = await registrationMessage.react('❌')
        activeUserRegistration.set(message.author.id, {
          step: 0,
          botMessage: registrationMessage,
          botReaction: botReaction,
          userID: message.author.id,
          registrationInformation: {
            discordID: message.author.id,
            notifications: false,
            matches: [],
            timestamp: undefined,
            valorantRank: 0,
            valorantUsername: ''
          }
        }) // add user to the list of users who are currently registering, and set their progress to 0 (none)
        if (message.guild) message.reply('Check your DMs!')
      })
  }

  else if (message.content === 'v!match create') {
    if (!message.guild) return message.reply('This command can only be run in a server!')
    const embed = new ScrimBotEmbed()
      .setTitle('Create a Match')
      .setDescription('Let\'s start a match!')
      .setAuthor(message.author.tag, message.author.avatarURL())
      .addField(matchCreationSteps[0][0], matchCreationSteps[0][1])
    message.channel.send(embed)
      .then(async creationMessage => {
        const reaction = await creationMessage.react('❌')
        activeMatchCreation.set(message.author.id, {
          step: 0,
          botMessage: creationMessage,
          botReaction: reaction,
          userID: message.author.id,
          userMessage: message,
          creationInformation: {
            players: { a: [], b: [] },
            spectators: false,
            map: 0,
            rankMinimum: '',
            rankMaximum: '',
            date: undefined,
            creator: message.author.id,
            status: 'created'
          }
        }) // add user to the list of users who are currently registering, and set their progress to 0 (none)
      })
  }

  else if (message.content.startsWith('v!match start')) {
    const matchID = message.content.split(' ')[2]

    if (!matchID) return message.reply('Match not found! Ensure correct match ID is submitted.')
    const matchInformationRef = db.collection('matches').doc(matchID)
    let matchInformation = await matchInformationRef.get()
    if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
    matchInformation = matchInformation.data()

    if (message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to start the match.')

    if (matchInformation.players.a.length === 0 && matchInformation.players.b.length === 0) return message.reply('There are no players in the match!')

    matchInformation.status = 'started'

    matchInformationRef.update(matchInformation)

    const embed = new ScrimBotEmbed()
      .setTitle('Match Started')
      .setDescription('Match with ID `' + matchID + '` has been started. Once complete, use `v!match score <match id> <score>` to report the score!')
      .setFooter('This message will self-destruct in 30 seconds.')
    message.reply(embed).then(msg => msg.delete({ timeout: 30000 }))

    const botMessageChannel = await client.channels.fetch(matchInformation.message.channel)
    const botMessage = await botMessageChannel.messages.fetch(matchID)
    const botMessageEmbed = botMessage.embeds[0]
    botMessageEmbed.fields[0].value = capitalizeFirstLetter(matchInformation.status)
    botMessage.edit('The match has started! <@233760849381163010> <@521910335888949278>', botMessageEmbed)
    if (message.guild.me.hasPermission('MANAGE_MESSAGES')) botMessage.reactions.removeAll()
  }

  else if (message.content.startsWith('v!match score')) {
    const matchID = message.content.split(' ')[2]
    const matchScore = message.content.split(' ')[3]

    if (/\d{1,2}-\d{1,2}/.test(matchScore) === false) return message.reply('Ensure your score is reported in the format `<team a>-<team b>` (e.g. `13-7`)')

    const matchInformationRef = db.collection('matches').doc(matchID)
    let matchInformation = await matchInformationRef.get()
    if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
    matchInformation = matchInformation.data()

    if (message.author.id !== matchInformation.creator) return message.reply('You are not the match creator! Please ask them to score the match.')

    matchInformation.status = 'completed'
    matchInformation.score = [matchScore.split('-')[0], matchScore.split('-')[1]]

    matchInformationRef.update(matchInformation)

    const embed = new ScrimBotEmbed()
      .setTitle('Match Completed')
      .setDescription('Match with ID `' + matchID + '` has been completed. Thanks for using ScrimBot, to create a new match type `v!match create`')
      .setFooter('This message will self-destruct in 30 seconds.')
    message.reply(embed).then(msg => msg.delete({ timeout: 30000 }))

    const botMessageChannel = await client.channels.fetch(matchInformation.message.channel)
    const botMessage = await botMessageChannel.messages.fetch(matchID)
    const botMessageEmbed = botMessage.embeds[0]
    botMessageEmbed.fields[0].value = capitalizeFirstLetter(matchInformation.status)
    botMessageEmbed.addField('Final Score', matchScore)
    botMessage.edit(botMessageEmbed)
    if (message.guild.me.hasPermission('MANAGE_MESSAGES')) botMessage.reactions.removeAll()

    for (const playerRef of matchInformation.players.a) {
      let playerDoc = await playerRef.get()
      playerDoc = playerDoc.data()
      playerDoc.matches.unshift(matchInformationRef)
      playerRef.update(playerDoc)
    }
    for (const playerRef of matchInformation.players.b) {
      let playerDoc = await playerRef.get()
      playerDoc = playerDoc.data()
      playerDoc.matches.unshift(matchInformationRef)
      playerRef.update(playerDoc)
    }
    if (matchInformation.spectators instanceof Array) {
      for (const playerRef of matchInformation.spectators) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        playerDoc.matches.unshift(matchInformationRef)
        playerRef.update(playerDoc)
      }
    }
  }

  else if (message.content.startsWith('v!match info')) {
    const matchID = message.content.split(' ')[2]

    if (!matchID) return message.reply('Match not found! Ensure correct match ID is submitted.')
    const matchInformationRef = db.collection('matches').doc(matchID)
    let matchInformation = await matchInformationRef.get()
    if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
    matchInformation = matchInformation.data()

    const matchCreator = await client.users.fetch(matchInformation.creator)

    const matchEmbed = new ScrimBotEmbed()
      .setTitle('Retrieved Match Information')
      .setDescription('')
      .setTimestamp(matchInformation.date.toDate())
      .setAuthor(matchCreator.tag, matchCreator.avatarURL())
      .setThumbnail(MAPS_THUMBNAILS[matchInformation.map])
      .addField('Status', capitalizeFirstLetter(matchInformation.status), true)
      .addField('Date', moment(matchInformation.date.toMillis()).tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('h:mm a z DD MMM, YYYY'), true)
      .addField('Map', capitalizeFirstLetter(matchInformation.map), true)
      .addField('Max Team Count', matchInformation.maxTeamCount, true)
      .addField('Minimum Rank', capitalizeFirstLetter(RANKS_REVERSED[matchInformation.rankMinimum]), true)
      .addField('Maximum Rank', capitalizeFirstLetter(RANKS_REVERSED[matchInformation.rankMaximum]), true)
      .addField('Team A', 'None', true)
      .addField('Team B', 'None', true)
      .addField('Spectators', matchInformation.spectators instanceof Array ? 'None' : 'Not allowed', true)
    matchEmbed.fields[6].value = ''
    for (const playerRef of matchInformation.players.a) {
      let playerDoc = await playerRef.get()
      playerDoc = playerDoc.data()
      matchEmbed.fields[6].value += `\n• ${playerDoc.valorantUsername}`
    }
    if (matchEmbed.fields[6].value === '') matchEmbed.fields[6].value = 'None'

    matchEmbed.fields[7].value = ''
    for (const playerRef of matchInformation.players.b) {
      let playerDoc = await playerRef.get()
      playerDoc = playerDoc.data()
      matchEmbed.fields[7].value += `\n• ${playerDoc.valorantUsername}`
    }
    if (matchEmbed.fields[7].value === '') matchEmbed.fields[7].value = 'None'

    if (matchInformation.spectators instanceof Array) {
      matchEmbed.fields[8].value = ''
      for (const playerRef of matchInformation.spectators) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        matchEmbed.fields[8].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (matchEmbed.fields[8].value === '') matchEmbed.fields[8].value = 'None'
    }

    if (matchInformation.status === 'completed') {
      matchEmbed.addField('Final Score', `${matchInformation.score[0]}-${matchInformation.score[1]}`)
    }
    message.reply(matchEmbed)
  }

  else if (message.content.startsWith('v!match edit')) {
    const attributes = message.content.split(' ')
    const matchID = attributes[2]
    if (!matchID) return message.reply('Please specify a match id to edit!')

    const editedProperty = attributes[3]
    if (!editedProperty) return message.reply('Please specify a property to edit! (date, map, minRank, maxRank, teamPlayerCount, spectators)')

    const editedValue = attributes[4]
    if (!editedValue) return message.reply('Please specify a value for ' + editedProperty)

    const matchInformationRef = db.collection('matches').doc(matchID)
    let matchInformation = await matchInformationRef.get()
    if (!matchInformation.exists) return message.reply('Match not found! Ensure correct match ID is submitted.')
    matchInformation = matchInformation.data()

    switch (editedProperty) {
      case 'date': {
        const dateString = [editedValue, attributes[5]]
        if (dateString.length === 2) {
          const actualDate = moment().tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('YYYY-MM-DD')
          dateString.push(actualDate)
        }

        const date = moment.tz(dateString.join(' '), 'h:mm a YYYY-MM-DD', process.env.TIME_ZONE || 'America/Los_Angeles').toDate()
        if (isNaN(date)) return message.reply('please give a valid date!').then(msg => msg.delete({ timeout: 5000 }))
        matchInformation.date = date
        break
      }
      case 'minRank': {
        if (editedValue.toLowerCase() === 'any') {
          matchInformation.rankMinimum = 0
          break
        } else if (!RANKS[editedValue.toUpperCase()]) {
          return message.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
        } else {
          matchInformation.rankMinimum = RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
          break
        }
      }
      case 'maxRank': {
        if (editedValue.toLowerCase() === 'any') {
          matchInformation.rankMaximum = 99
          break
        } else if (!RANKS[editedValue.toUpperCase()]) {
          return message.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
        } else if (RANKS[editedValue.toUpperCase()] < matchInformation.rankMinimum) {
          return message.reply('the maximum rank cannot be below the minimum rank!').then(msg => msg.delete({ timeout: 5000 }))
        } else {
          matchInformation.rankMaximum = RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
          break
        }
      }
      case 'teamPlayerCount': {
        if (!Number(editedValue) || Number(editedValue) > 5) {
          return message.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
        } else {
          matchInformation.maxTeamCount = Number(editedValue)
          break
        }
      }
      case 'spectators':
        matchInformation.spectators = (AFFIRMATIVE_WORDS.includes(editedValue.toLowerCase())) ? [] : false
        break
      case 'map': {
        if (editedValue.toLowerCase() === 'any') {
          matchInformation.map = MAPS[Math.floor(Math.random() * Math.floor(MAPS.length))]
          break
        } else if (isNaN(editedValue) || Number(editedValue) > MAPS.length) {
          return message.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
        } else {
          matchInformation.map = MAPS[Number(editedValue - 1)]
          break
        }
      }
    }

    matchInformationRef.update(matchInformation)
    message.reply(`${editedProperty} successfully changed to ${editedValue} for match ${matchID}!`)
  }

  else if (message.content.startsWith('v!user info')) {
    let userID = message.content.split(' ')[2]

    if (!userID) userID = message.author.id
    if (userID.startsWith('<@')) {
      userID = userID.replace(/<@!?/, '').replace(/>$/, '')
    }
    const userInformationRef = db.collection('users').doc(userID)
    let userInformation = await userInformationRef.get()
    if (!userInformation.exists) return message.reply('User not found! Ensure correct user ID is submitted.')
    userInformation = userInformation.data()

    const userDiscordInformation = await client.users.fetch(userID)

    const userEmbed = new ScrimBotEmbed()
      .setTitle('Retrieved User Information')
      .setDescription('')
      .setTimestamp(new Date())
      .setAuthor(userDiscordInformation.tag, userDiscordInformation.avatarURL())
      .setThumbnail(userDiscordInformation.avatarURL())
      .addField('Valorant Username', userInformation.valorantUsername, true)
      .addField('Valorant Rank', capitalizeFirstLetter(RANKS_REVERSED[userInformation.valorantRank]), true)
      .addField('Registration Date', moment(userInformation.timestamp.toMillis()).tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('h:mm a z DD MMM, YYYY'))
      .addField('Notifications Enabled', userInformation.notifications === true ? 'Yes' : 'No', true)
      .addField('Matches Played', userInformation.matches.length, true)
    message.reply(userEmbed)
  }

  else if (message.content.startsWith('v!user edit')) {
    const attributes = message.content.split(' ')
    const editedProperty = attributes[2]
    if (!editedProperty) return message.reply('Please specify a property to edit! (username, rank, notifications)')

    const editedValue = attributes[3]
    if (!editedValue) return message.reply('Please specify a value for ' + editedProperty)

    const userInformationRef = db.collection('users').doc(message.author.id)
    let userInformation = await userInformationRef.get()
    if (!userInformation.exists) return message.reply('User not found! Are you registered with ScrimBot?')
    userInformation = userInformation.data()

    switch (editedProperty) {
      case 'username':
        userInformation.valorantUsername = editedValue
        break
      case 'rank':
        if (!RANKS[editedValue.toUpperCase()]) {
          return message.reply('Please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
        } else {
          userInformation.valorantRank = RANKS[editedValue.toUpperCase()] // TODO: cover edge cases
          break
        }
      case 'notifications':
        userInformation.notifications = (AFFIRMATIVE_WORDS.includes(editedValue.toLowerCase()))
        break
      default:
        return message.reply('Requested property not found!')
    }

    userInformationRef.update(userInformation)
    message.reply(`${editedProperty} successfully changed to ${editedValue}!`)
  }

  else if (message.content === 'v!help') {
    const embed = new ScrimBotEmbed()
      .setTitle('Help')
      .setDescription(`v!help: Show this help menu.
      v!ping: Play a game of ping pong.
      v!register: Register to join matches.
      v!match create: Create a match.
      v!match join: Join a match.
      v!match start <match id>: Start a match (only for match creator)
      v!match score <match id> <team a score>-<team b score>: Report final match score (only for match creator)
      v!match edit <match id> <property to edit> <edited value>: Edit match information (only for match creator)
      v!match info <match id>: Retrieves match information
      v!user info <mention or user id>: Retrieves user information
      v!user edit <username, rank, notifications> <edited value>: Edit user info
      
      *Special thanks to Limitless Gaming:* https://discord.gg/kKPSCaB`)
    embed.setFooter('', true)
    message.channel.send(embed)
  }

  else if (message.content === 'v!status') {
    const embed = new ScrimBotEmbed()
      .setTitle('Bot Status')
      .setDescription(`Current Uptime: ${Math.floor(client.uptime / 60000)} minutes\nCurrent Ping: ${client.ws.ping}ms\nRunning on Port: ${app.get('port')}`)
    message.channel.send(embed)
  }

  else if (message.content === 'v!ping') {
    const embed = new ScrimBotEmbed()
      .setTitle('You have pinged me')
      .setDescription(`Who's down for a game of ping pong?\n${client.ws.ping}ms`)
      .setURL('https://pong-2.com/')
    message.reply(embed)
  }

  else if (message.content === 'v!uptime') {
    const embed = new ScrimBotEmbed()
      .setTitle('Uptime')
      .setDescription(`ScrimBot has been online for ${Math.floor(client.uptime / 60000)} minutes :)`)
    message.reply(embed)
  }

  else if (message.content === 'v!coinflip' || message.content === 'v!cf') {
    const embed = new ScrimBotEmbed()
      .setTitle('Flip a Coin')
      .setDescription('A coin will be flipped in 7 seconds, call heads or tails!')
    const coinflipMessage = await message.reply(embed)

    for (let i = 7; i >= 0; i--) {
      embed.setDescription(`A coin will be flipped in ${i} seconds, call heads or tails`)
      coinflipMessage.edit(embed)
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
    const decision = Math.floor(Math.random() * Math.floor(2))

    embed.setDescription(`The final decision is ${decision === 0 ? '**HEADS**' : '**TAILS**'}`)
    coinflipMessage.edit(embed)
  }

  else if (message.content === 'v!restart') {
    const existingRecord = await db.collection('botAdmins').doc(message.author.id).get()
      .catch(console.error)
    if (!existingRecord.exists) return message.reply('fuck off')
    const embed = new ScrimBotEmbed()
      .setTitle('Restarting!')
      .setDescription('See you soon!')
    await message.channel.send(embed)
    client.destroy()
    process.exit(0)
  }

  else if (message.content === 'v!shutdown') {
    const existingRecord = await db.collection('botAdmins').doc(message.author.id).get()
      .catch(console.error)
    if (!existingRecord.exists) return message.reply('go away you pleb')
    const embed = new ScrimBotEmbed()
      .setTitle('Shutdown!')
      .setDescription('Adios!')
    await message.channel.send(embed)
    client.destroy()
    process.exit(0)
  }
  /* eslint-enable brace-style */
})










// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Reaction actions

client.on('messageReactionAdd', (reaction, user) => {
  if (user.bot) return // ignore messages from the bot itself or other bots

  if (activeUserRegistration.has(user.id)) cancelUserRegistration(reaction, user)
  else if (activeMatchCreation.has(user.id)) cancelMatchCreation(reaction, user)
  addPlayerToMatch(reaction, user)
})

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return // ignore messages from the bot itself or other bots

  removePlayerFromMatch(reaction, user)
})






// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - User registration shit

const handleUserRegistration = (userRecord, userMessage) => {
  if (userMessage.channel.type !== 'dm') return

  switch (userRecord.step) {
    case 0:
      userRecord.registrationInformation.valorantUsername = userMessage.content
      break
    case 1:
      if (!RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('Please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        userRecord.registrationInformation.valorantRank = RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        break
      }
    case 2:
      userRecord.registrationInformation.notifications = (AFFIRMATIVE_WORDS.includes(userMessage.content.toLowerCase()))
      break
  }

  if (userRecord.step < userRegistrationSteps.length - 1) {
    const embed = userRecord.botMessage.embeds[0]

    const previousField = embed.fields[userRecord.step]
    previousField.name = '✅ ' + previousField.name

    userRecord.step = userRecord.step + 1

    const stepInfo = userRegistrationSteps[userRecord.step]
    embed.addField(stepInfo[0], stepInfo[1])
    userRecord.botMessage.edit(embed)

    activeUserRegistration.set(userRecord.userID, userRecord)
  } else {
    const embed = new ScrimBotEmbed()
      .setTitle('ScrimBot Registration Complete')
      .setDescription('Thanks for registering! Now it\'s time to get playing!')
    userRecord.botMessage.edit(embed)
    userRecord.botReaction.users.remove(client.user)
    userRecord.registrationInformation.timestamp = new Date()
    db.collection('users').doc(userRecord.userID).set(userRecord.registrationInformation)
    activeUserRegistration.delete(userRecord.userID)
  }
}

const cancelUserRegistration = async (reaction, user) => {
  if (reaction.emoji.name === '❌') {
    const userRecord = activeUserRegistration.get(user.id)
    const embed = new ScrimBotEmbed()
      .setTitle('ScrimBot Registration Cancelled')
      .setDescription('Your registration has been cancelled. If you want to try again, just type !register.')
    userRecord.botMessage.edit(embed)
    activeUserRegistration.delete(userRecord.userID)
    reaction.remove()
  }
}








// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Match shit

const handleMatchCreation = async (matchRecord, userMessage) => {
  if (userMessage.channel !== matchRecord.botMessage.channel) return

  if (userMessage.guild.me.hasPermission('MANAGE_MESSAGES')) userMessage.delete({ timeout: 500 })
  switch (matchRecord.step) {
    case 0: {
      const dateString = userMessage.content.split(' ')
      if (dateString.length === 2) {
        const actualDate = moment().tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('YYYY-MM-DD')
        dateString.push(actualDate)
      }

      const date = moment.tz(dateString.join(' '), 'h:mm a YYYY-MM-DD', process.env.TIME_ZONE || 'America/Los_Angeles').toDate()
      if (isNaN(date)) return userMessage.reply('please give a valid date!').then(msg => msg.delete({ timeout: 5000 }))
      matchRecord.creationInformation.date = date
      break
    }
    case 1: {
      if (userMessage.content.toLowerCase() === 'any') {
        matchRecord.creationInformation.rankMinimum = 0
        break
      } else if (!RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.rankMinimum = RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        break
      }
    }
    case 2: {
      if (userMessage.content.toLowerCase() === 'any') {
        matchRecord.creationInformation.rankMaximum = 99
        break
      } else if (!RANKS[userMessage.content.toUpperCase()]) {
        return userMessage.reply('please give a valid rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else if (RANKS[userMessage.content.toUpperCase()] < matchRecord.creationInformation.rankMinimum) {
        return userMessage.reply('the maximum rank cannot be below the minimum rank!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.rankMaximum = RANKS[userMessage.content.toUpperCase()] // TODO: cover edge cases
        break
      }
    }
    case 3: {
      if (!Number(userMessage.content) || Number(userMessage.content) > 5) {
        return userMessage.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.maxTeamCount = Number(userMessage.content)
        break
      }
    }
    case 4:
      matchRecord.creationInformation.spectators = (AFFIRMATIVE_WORDS.includes(userMessage.content.toLowerCase())) ? [] : false
      break
    case 5: {
      if (userMessage.content.toLowerCase() === 'any') {
        matchRecord.creationInformation.map = MAPS[Math.floor(Math.random() * Math.floor(MAPS.length))]
        break
      } else if (isNaN(userMessage.content) || Number(userMessage.content) > MAPS.length) {
        return userMessage.reply('please give a valid number!').then(msg => msg.delete({ timeout: 5000 }))
      } else {
        matchRecord.creationInformation.map = MAPS[Number(userMessage.content - 1)]
        break
      }
    }
  }

  if (matchRecord.step < matchCreationSteps.length - 1) {
    const embed = matchRecord.botMessage.embeds[0]

    const previousField = embed.fields[matchRecord.step]
    previousField.name = '✅ ' + previousField.name

    matchRecord.step = matchRecord.step + 1

    const stepInfo = matchCreationSteps[matchRecord.step]
    embed.addField(stepInfo[0], stepInfo[1])
    matchRecord.botMessage.edit(embed)

    activeMatchCreation.set(matchRecord.userID, matchRecord)
  } else {
    const embed = new ScrimBotEmbed()
      .setAuthor(userMessage.author.tag, userMessage.author.avatarURL())
      .setTitle('Match Creation Complete')
      .setDescription('Your match has been made! To start it, type `v!match start <match id>`')
      .setFooter('This message will self-destruct in 30 seconds.')
    matchRecord.botMessage.edit(embed)
    matchRecord.botMessage.delete({ timeout: 30000 })
    if (userMessage.guild.me.hasPermission('MANAGE_MESSAGES')) matchRecord.botMessage.reactions.removeAll()
    else matchRecord.botReaction.remove()
    matchRecord.creationInformation.timestamp = new Date()

    const matchEmbed = new ScrimBotEmbed()
      .setTitle('Match Information')
      .setDescription('React with 🇦 to join the A team, react with 🇧 to join the B team and, if enabled, react with 🇸 to be a spectator.')
      .setThumbnail(MAPS_THUMBNAILS[matchRecord.creationInformation.map])
      .setTimestamp(new Date(matchRecord.creationInformation.date))
      .setAuthor(userMessage.author.tag, userMessage.author.avatarURL())
      .addField('Status', capitalizeFirstLetter(matchRecord.creationInformation.status), true)
      .addField('Date', moment(matchRecord.creationInformation.date).tz(process.env.TIME_ZONE || 'America/Los_Angeles').format('h:mm a z DD MMM, YYYY'), true)
      .addField('Map', capitalizeFirstLetter(matchRecord.creationInformation.map), true)
      .addField('Max Team Count', matchRecord.creationInformation.maxTeamCount + ' players per team', true)
      .addField('Minimum Rank', capitalizeFirstLetter(RANKS_REVERSED[matchRecord.creationInformation.rankMinimum]), true)
      .addField('Maximum Rank', capitalizeFirstLetter(RANKS_REVERSED[matchRecord.creationInformation.rankMaximum]), true)
      .addField('Team A', 'None', true)
      .addField('Team B', 'None', true)
      .addField('Spectators', matchRecord.creationInformation.spectators instanceof Array ? 'None' : 'Not allowed', true)
    matchRecord.botMessage.channel.send(matchEmbed)
      .then(message => {
        message.react('🇦')
        message.react('🇧')
        if (matchRecord.creationInformation.spectators) message.react('🇸')
        matchEmbed.setFooter(`match id: ${message.id}`)
        message.edit(matchEmbed)
        matchRecord.creationInformation.message = {
          id: message.id,
          channel: message.channel.id
        }
        db.collection('matches').doc(message.id).set(matchRecord.creationInformation)
        activeMatchCreation.delete(matchRecord.userID)
        matchRecord.userMessage.delete()
      })
  }
}

const cancelMatchCreation = async (reaction, user) => {
  if (reaction.emoji.name === '❌') {
    const userRecord = activeMatchCreation.get(user.id)
    const embed = new ScrimBotEmbed()
      .setTitle('ScrimBot Match Creation Cancelled')
      .setDescription('Your Match Creation has been cancelled. If you want to try again, just type !match create.')
    userRecord.botMessage.edit(embed)
    activeMatchCreation.delete(userRecord.userID)
    reaction.remove()
  }
}

const addPlayerToMatch = async (reaction, user) => {
  const matchInformationRef = db.collection('matches').doc(reaction.message.id)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return
  matchInformation = matchInformation.data()
  if (matchInformation.status !== 'created') return

  const playerInformationRef = db.collection('users').doc(user.id)
  let playerInformation = await playerInformationRef.get()
  if (!playerInformation.exists) {
    reaction.message.channel.send(`<@${user.id}>, you are not registered with ScrimBot. Please type v!register before reacting!`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }
  playerInformation = playerInformation.data()

  if (matchInformation.players.a.find(e => e.id === playerInformationRef.id) || matchInformation.players.b.find(e => e.id === playerInformationRef.id) || (matchInformation.spectators && matchInformation.spectators.find(e => e.id === playerInformationRef.id))) {
    reaction.message.channel.send(`<@${user.id}>, you have already joined a team! Please remove that reaction before joining a new one.`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  if (playerInformation.valorantRank < matchInformation.rankMinimum || playerInformation.valorantRank > matchInformation.rankMaximum) {
    reaction.message.channel.send(`<@${user.id}>, you do not meet the match rank requirements! Please try a different one or ask the match creator to adjust them.`).then(msg => msg.delete({ timeout: 5000 }))
    reaction.users.remove(user.id)
    return
  }

  const messageEmbed = reaction.message.embeds[0]

  switch (reaction.emoji.name) {
    case '🇦':
      if (matchInformation.players.a.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`<@${user.id}>, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[6].value === 'None' ? messageEmbed.fields[6].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[6].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.players.a.push(playerInformationRef)
        break
      }
    case '🇧':
      if (matchInformation.players.b.length >= matchInformation.maxTeamCount) {
        reaction.message.channel.send(`<@${user.id}>, the selected team is full! Please choose a different one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[7].value === 'None' ? messageEmbed.fields[7].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[7].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.players.b.push(playerInformationRef)
        break
      }
    case '🇸':
      if (!matchInformation.spectators) {
        reaction.message.channel.send(`<@${user.id}>, this match does not allow spectators! Either join a team or ask the match creator to start a new one.`).then(msg => msg.delete({ timeout: 5000 }))
        reaction.users.remove(user.id)
        return
      } else {
        messageEmbed.fields[8].value === 'None' ? messageEmbed.fields[8].value = `• ${playerInformation.valorantUsername}` : messageEmbed.fields[8].value += `\n• ${playerInformation.valorantUsername}`
        matchInformation.spectators.push(playerInformationRef)
        break
      }
  }

  reaction.message.edit(messageEmbed)
  matchInformationRef.update(matchInformation)
}

const removePlayerFromMatch = async (reaction, user) => {
  const matchInformationRef = db.collection('matches').doc(reaction.message.id)
  let matchInformation = await matchInformationRef.get()
  if (!matchInformation.exists) return
  matchInformation = matchInformation.data()
  if (matchInformation.status !== 'created') return

  const playerInformationRef = db.collection('users').doc(user.id)
  let playerInformation = await playerInformationRef.get()
  if (!playerInformation.exists) return
  playerInformation = playerInformation.data()

  const messageEmbed = reaction.message.embeds[0]

  let playersArrayIndex
  switch (reaction.emoji.name) {
    case '🇦':
      playersArrayIndex = matchInformation.players.a.findIndex(e => e.id === playerInformationRef.id)
      if (playersArrayIndex > -1) matchInformation.players.a.splice(playersArrayIndex, 1)

      messageEmbed.fields[6].value = ''
      for (const playerRef of matchInformation.players.a) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        messageEmbed.fields[6].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[6].value === '') messageEmbed.fields[6].value = 'None'
      break
    case '🇧':
      playersArrayIndex = matchInformation.players.b.findIndex(e => e.id === playerInformationRef.id)
      if (playersArrayIndex > -1) matchInformation.players.b.splice(playersArrayIndex, 1)

      messageEmbed.fields[7].value = ''
      for (const playerRef of matchInformation.players.b) {
        let playerDoc = await playerRef.get()
        playerDoc = playerDoc.data()
        messageEmbed.fields[7].value += `\n• ${playerDoc.valorantUsername}`
      }
      if (messageEmbed.fields[7].value === '') messageEmbed.fields[7].value = 'None'
      break
    case '🇸':
      if (matchInformation.spectators) {
        playersArrayIndex = matchInformation.spectators.findIndex(e => e.id === playerInformationRef.id)
        if (playersArrayIndex > -1) matchInformation.spectators.splice(playersArrayIndex, 1)

        messageEmbed.fields[8].value = ''
        for (const playerRef of matchInformation.spectators) {
          let playerDoc = await playerRef.get()
          playerDoc = playerDoc.data()
          messageEmbed.fields[8].value += `\n• ${playerDoc.valorantUsername}`
        }
        if (messageEmbed.fields[8].value === '') messageEmbed.fields[8].value = 'None'
      }
      break
  }

  reaction.message.edit(messageEmbed)
  matchInformationRef.update(matchInformation)
}

const addOldMessagesToCache = async () => {
  const snapshot = await db.collection('matches').where('status', '==', 'created').get()
  if (snapshot.empty) return // no open matches found

  snapshot.forEach(async doc => {
    const match = doc.data()

    const messageChannel = await client.channels.fetch(match.message.channel)
    messageChannel.messages.fetch(match.message.id)
  })
}

if (process.env.TOKEN) {
  client.login(process.env.TOKEN)
} else {
  console.error('Bot token not found! Ensure environment variable TOKEN contains the bot token. If you don\'t understand this, go read the documentation.')
}










// \\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// MARK: - Helper functions

const capitalizeFirstLetter = string => {
  string = string.toLowerCase()
  return string.charAt(0).toUpperCase() + string.slice(1)
}

process.on('unhandledRejection', console.error)
