const { SlashCommandBuilder } = require('discord.js');

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FETCH_PAGE_SIZE = 100;
const MAX_PAGES = 10;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('randommessage')
		.setDescription('Sends a random non-bot message from the last 24 hours.')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('Optional channel to search. Defaults to the current channel.')
				.setRequired(false),
		),
	async execute(interaction) {
		const targetChannel = interaction.options.getChannel('channel') ?? interaction.channel;

		if (!targetChannel || !targetChannel.isTextBased() || !targetChannel.messages) {
			await interaction.reply('This command can only be used in a text channel.');
			return;
		}

		await interaction.deferReply();

		const cutoffTimestamp = Date.now() - DAY_IN_MS;
		const recentMessages = [];
		let beforeMessageId;

		for (let page = 0; page < MAX_PAGES; page++) {
			const fetchedMessages = await targetChannel.messages.fetch({
				limit: FETCH_PAGE_SIZE,
				before: beforeMessageId,
			});

			if (fetchedMessages.size === 0) {
				break;
			}

			for (const message of fetchedMessages.values()) {
				if (message.createdTimestamp < cutoffTimestamp) {
					continue;
				}

				if (!message.author.bot) {
					recentMessages.push(message);
				}
			}

			const oldestFetched = fetchedMessages.last();
			if (!oldestFetched || oldestFetched.createdTimestamp < cutoffTimestamp) {
				break;
			}

			beforeMessageId = oldestFetched.id;
		}

		if (recentMessages.length === 0) {
			await interaction.editReply('No non-bot messages found in that channel from the last 24 hours.');
			return;
		}

		const randomMessage = recentMessages[Math.floor(Math.random() * recentMessages.length)];
		const textContent = randomMessage.content.trim();
		const firstAttachment = randomMessage.attachments.first();

		let output = ``;

		if (textContent) {
			output += textContent;
		} else if (firstAttachment) {
			output += firstAttachment.url;
		} else {
			output += '[Message has no readable text content. If this is unexpected, enable Message Content Intent in the Discord Developer Portal.]';
		}

        output += `\n-${randomMessage.author}, <t:${Math.floor(randomMessage.createdTimestamp / 1000)}:R>\n`;

		output += `\n${randomMessage.url}`;

		if (output.length > 2000) {
			output = `${output.slice(0, 1997)}...`;
		}

		await interaction.editReply(output);
	},
};