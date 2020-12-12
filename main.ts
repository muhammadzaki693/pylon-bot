const commands = new discord.command.CommandGroup({
  defaultPrefix: '_' // You can customize your default prefix here.
});

commands.raw('ping', (message) => message.reply('pong!'));

commands.raw('catfact', async (message) => {
  const req = await fetch('https://catfact.ninja/fact');
  const data = await req.json();
  await message.reply(
    new discord.Embed({
      title: '😺 A random cat fact 🐈',
      color: 0x00ff00,
      description: data['fact'],
      footer: {
        text: 'powered by https://catfact.ninja'
      }
    })
  );
});

commands.raw('log', async (message) => {
  console.log(message);
});

commands.on(
  { name: 'kick', filters: discord.command.filters.isAdministrator() },
  (ctx) => ({
    member: ctx.guildMember(),
    reason: ctx.textOptional()
  }),
  async (message, { member, reason }) => {
    await message.reply(
      `Cya, ${member.toMention()} - you're kicked because ${reason}!`
    );
    await message.reply(`JK!`);
  }
);

const tagsKv = new pylon.KVNamespace('tags');

commands.subcommand('tag', (subcommand) => {
  subcommand.on(
    'set',
    (ctx) => ({
      key: ctx.string(),
      value: ctx.text()
    }),
    async (message, { key, value }) => {
      await tagsKv.put(key, value);
      await message.reply({
        content: `Alright, I've saved the tag for **${key}**!`,
        allowedMentions: {}
      });
    }
  );

  subcommand.on(
    { name: 'delete', filters: discord.command.filters.canManageMessages() },
    (ctx) => ({ key: ctx.string() }),
    async (message, { key }) => {
      await tagsKv.delete(key);
      await message.reply({
        content: `Alright, I've deleted the tag for **${key}**!`,
        allowedMentions: {}
      });
    }
  );

  subcommand.default(
    (ctx) => ({ key: ctx.string() }),
    async (message, { key }) => {
      // Retrieve the tag from the database. We are using `.get<string>(...)` as we have stored a string
      // in the database before.
      const value = await tagsKv.get<string>(key);

      if (value == null) {
        // If the value is null, that means that the tag did not exist in the database.
        await message.reply({
          content: `Unknown tag: **${key}**`,
          allowedMentions: {}
        });
      } else {
        // Otherwise, let's send back the tag value. Again, we're using `allowedMentions: {}` here
        // to ensure that the bot sending the tag is not able to ping anyone!
        await message.reply({ content: value, allowedMentions: {} });
      }
    }
  );
});

commands.on(
  'say',
  (args) => ({
    input: args.text(),
    delete: 'say'
  }),
  async (message, { input }) => {
    await message.delete();
    await message.reply({
      content: input,
      allowedMentions: {}
    });
  }
);
