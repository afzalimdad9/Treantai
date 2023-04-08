// Imports
import axios from 'axios';
import chalk from 'chalk';
import Discord, {
  Client, REST, Partials,
  GatewayIntentBits, Routes,
  ActivityType, ChannelType
}
  from 'discord.js';
import dotenv from 'dotenv';
import { ChatGPTAPI } from 'chatgpt';
process.env.NODE_ENV !== 'production' && dotenv.config({ path: './.env.local' });

// Defines
const activity = 'Minecraft'

// Discord Slash Commands Defines
const commands = [
  {
    name: 'chat',
    description: 'No description provided',
    dm_permission: false,
    options: [
      {
        name: "prompt",
        description: 'No description provided',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'image',
    dm_permission: false,
    description: 'Create AI Images from 10+ different styles',
    options: [
      {
        name: "prompt",
        description: 'A prompt to condition the model with.',
        type: 3,
        required: true
      },
      {
        name: "negative_prompt",
        description: 'A negative prompt to avoid the condition.',
        type: 3,
      },
      {
        name: "style",
        description: 'Style/model of the image.',
        type: 3,
        choices: [{
          name: 'stable-diffusion',
          value: 'stable-diffusion',

        }, {
          name: 'openjourney',
          value: 'openjourney',

        }, {
          name: 'anime',
          value: 'anime',

        }, {
          name: 'paint',
          value: 'paint',

        }, {
          name: 'disney',
          value: 'disney',

        }, {
          name: 'portrait',
          value: 'portrait',

        }, {
          name: '3D',
          value: '3D',

        }, {
          name: 'anime_v2',
          value: 'anime_v2',

        }]
      },
      {
        name: "width",
        description: 'Width of the generated image.',
        type: 3,
        choices: [{
          name: '192',
          value: '192',

        }, {
          name: '256',
          value: '256',

        }, {
          name: '320',
          value: '320',

        }, {
          name: '384',
          value: '384',

        }, {
          name: '448',
          value: '448',

        }, {
          name: '512',
          value: '512',

        }, {
          name: '576',
          value: '576',

        }, {
          name: '640',
          value: '640',

        }, {
          name: '704',
          value: '704',

        }, {
          name: '768',
          value: '768',

        }]
      },
      {
        name: "height",
        description: 'Height of the generated image.',
        type: 3,
        choices: [{
          name: '192',
          value: '192',

        }, {
          name: '256',
          value: '256',

        }, {
          name: '320',
          value: '320',

        }, {
          name: '384',
          value: '384',

        }, {
          name: '448',
          value: '448',

        }, {
          name: '512',
          value: '512',

        }, {
          name: '576',
          value: '576',

        }, {
          name: '640',
          value: '640',

        }, {
          name: '704',
          value: '704',

        }, {
          name: '768',
          value: '768',

        }]
      },
      {
        name: "guidance_scale",
        description: 'Classifier-Free Guidance Scale.',
        type: 3,
      },
      {
        name: "steps",
        description: 'The amount of steps to sample the model.',
        type: 3,
        choices: [{ name: '5', value: '5' }, { name: '10', value: '10' }, { name: '15', value: '15' }, { name: '20', value: '20' }, { name: '25', value: '25' }, { name: '30', value: '30' }, { name: '35', value: '35' }, { name: '40', value: '40' }, { name: '45', value: '45' }, { name: '50', value: '50' }]
      },
      {
        name: "seed",
        description: 'The seed to use for reproduceability.',
        type: 3,
      }
    ]
  }
];


// Initialize OpenAI Session
async function initOpenAI() {
  if (process.env.API_ENDPOINT.toLocaleLowerCase() === 'default') {
    const api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      debug: process.env.DEBUG
    });
    return api;
  } else {
    const api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      apiBaseUrl: process.env.API_ENDPOINT.toLocaleLowerCase(),
      debug: process.env.DEBUG
    });
    return api;
  }
}

// Initialize Discord Application Commands & New ChatGPT Thread
async function initDiscordCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('Started refreshing application commands (/)');
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands }).then(() => {
      console.log('Successfully reloaded application commands (/)');
    }).catch(e => console.log(chalk.red(e.message)));
    console.log('Connecting to Discord Gateway...');
  } catch (error) {
    console.log(chalk.red(error.message));
  }
}


// Main Function (Execution Starts From Here)
async function main() {
  const api = await initOpenAI().catch(error => {
    console.error(error.message);
    process.exit();
  });
  await initDiscordCommands().catch(e => { console.log(e.message) });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel]
  });

  client.login(process.env.DISCORD_BOT_TOKEN).catch(e => console.log(chalk.red(e.message)));

  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(chalk.greenBright('Connected to Discord Gateway'));
    console.log(new Date())
    client.user.setStatus('online');
    client.user.setActivity(activity);
  });

  // Channel Message Handler
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    client.user.setActivity(interaction.user.tag, { type: ActivityType.Watching });

    switch (interaction.commandName) {
      case "chat":
        chat_Interaction_Handler(interaction);
        break;
      case "image":
        image_Interaction_Handler(interaction);
        break;
      default:
        await interaction.reply({ content: 'Command Not Found' });
    }
  });

  // Direct Message Handler
  client.on("messageCreate", async message => {
    if (process.env.DIRECT_MESSAGES !== "true" || message.channel.type != ChannelType.DM || message.author.bot) {
      return;
    }

    if (!process.env.DM_WHITELIST_ID.includes(message.author.username)) {
      await message.author.send("Ask Bot Owner To WhiteList Your ID 🙄");
      return;
    }

    try {
      let sentMessage = await message.author.send({ content: `AI Text is being generated for ${message.author}` });

      askprompt(message.content, async (response) => {
        if (!response.text)
          await sentMessage.edit(`AI Text Generated by ${message.author}\n\n**Prompt:** ${message.content}\n\n**AI Response:** API Error ❌\nTry Again Later 😅\n`);

        console.log(response)
        if (response.text?.length >= process.env.DISCORD_MAX_RESPONSE_LENGTH) {
          splitAndSendResponse(response.text, message.author)
        } else {
          await sentMessage.edit(`AI Text Generated by ${message.author}\n\n**Prompt:** ${message.content}\n\n**AI Response:** ${response.text}\n`)
        }
      })
    } catch (e) {
      console.error(e.message)
    }
  })

  async function image_Interaction_Handler(interaction) {
    const prompt = interaction.options.getString("prompt");
    const negative_prompt = interaction.options.getString("negative_prompt");
    const width = interaction.options.getString("width");
    const height = interaction.options.getString("height");
    const model_id = interaction.options.getString("style");
    const steps = interaction.options.getString("steps");
    const seed = interaction.options.getString("seed");
    const guidance_scale = interaction.options.getString("guidance_scale");


    const style = model_id === 'stable-diffusion' ? 'arcane-diffusion' :
      model_id === 'openjourney' ? 'midjourney' :
        model_id === 'anime' ? 'animefull' :
          model_id === 'paint' ? 'midjourney-v4-painta' :
            model_id === 'disney' ? 'cartoonish' :
              model_id === 'portrait' ? 'portraitplus-diffusion' :
                model_id === '3D' ? 'realistic3d-model' :
                  model_id === 'anime_v2' ? 'animefull2' : ''
    try {

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "key": process.env.STABLEDIFFUSION_KEY,
          "prompt": prompt,
          "negative_prompt": negative_prompt || null,
          "width": width || '512',
          "model_id": model_id ? style : 'arcane-diffusion',
          "height": height || '512',
          "samples": "1",
          "num_inference_steps": steps || '5',
          "seed": seed || null,
          "guidance_scale": guidance_scale || 7.5,
          "safety_checker": "yes",
          "webhook": null,
          "track_id": null
        }
        )
      };
      await interaction.reply({ content: `AI Text is being generated for ${interaction.user}` });
      await fetch('https://stablediffusionapi.com/api/v3/dreambooth', options)
        .then((response) => response.json())
        .then((response) => {
          interaction.editReply(
            {
              files: [{ attachment: response.output[0], name: 'file.png' }]
              , content: `Image Request generated for ${interaction.user}\n\n**Prompt:** ${prompt}\n${((negative_prompt && `**Negative Prompt:** ${negative_prompt}\n` || '') + (width && `**Width:** ${width}\n` || '') + (height && `**Height:** ${height}\n` || '') + (model_id && `**Style:** ${model_id}\n` || '') + (steps && `**Steps:** ${steps}\n` || '') + (seed && `**Seed:** ${seed}\n` || '') + (guidance_scale && `**Guidance Scale:** ${guidance_scale}\n` || '')) || ''}`
            }
          );
          client.user.setActivity(activity);

        }).catch(e => {
          console.error(e.message)
        });
    } catch (e) {
      console.error(chalk.red(e.message));
    }
  }

  async function chat_Interaction_Handler(interaction) {
    const prompt = interaction.options.getString("prompt");
    try {
      await interaction.reply({ content: `AI Text is being generated for ${interaction.user}` });
      askprompt(prompt, async (content) => {
        if (!content.text) {
          await interaction.editReply(`AI Text Generated by ${interaction.user}\n\n**Prompt:** ${prompt}\n\n**AI Response:** API Error ❌ Try Again Later 😅\n`);
        }

        if (content.text?.length >= process.env.DISCORD_MAX_RESPONSE_LENGTH) {
          await interaction.editReply({ content: "The Answer Is Too Powerful 🤯,\nCheck Your DM 😅" });
          splitAndSendResponse(content.text, interaction.user);
        } else {
          await interaction.editReply(`AI Text Generated by ${interaction.user}\n\n**Prompt:** ${prompt}\n\n**AI Response:** ${content.text}`);
        }
        client.user.setActivity(activity);
      })
    } catch (e) {
      console.error(chalk.red(e.message));
    }
  }

  async function askprompt(prompt, cb) {

    api.sendMessage(prompt).then((response) => {
      cb(response);
    }).catch((err) => {
      cb(`Oppss, something went wrong! ${err.message}`);
    })
  }

  async function splitAndSendResponse(resp, user) {
    while (resp.length > 0) {
      let end = Math.min(process.env.DISCORD_MAX_RESPONSE_LENGTH, resp.length)
      await user.send(resp.slice(0, end))
      resp = resp.slice(end, resp.length)
    }
  }
}

// Discord Rate Limit Check
setInterval(() => {
  axios
    .get('https://discord.com/api/v10')
    .catch(error => {
      if (error.status == 429) {
        console.log("Discord Rate Limited");
        console.warn("Status: " + error.status)
        console.warn(error.message)
        // TODO: Take Action (e.g. Change IP Address)
      }
    });

}, 30000); // Check Every 30 Second

main() // Call Main function

// ---EoC---