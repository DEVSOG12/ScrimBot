module.exports = exports = {
  name: 'invite',
  usage: '',
  enabled: true,
  process: async (message, GLOBALS) => {
    const embed = new GLOBALS.Embed()
      .setTitle('Add me to your server!')
      .setURL(`https://discord.com/oauth2/authorize?client_id=${GLOBALS.client.user.id}&scope=bot&permissions=285355008 `)
    message.reply(embed)
  }
}
