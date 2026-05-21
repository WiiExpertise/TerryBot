const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('terry').setDescription('Sends a random Terry image.'),
	async execute(interaction) {
		const imagesPath = path.join(__dirname, '..', '..', 'resources', 'terry-images');
		const imageFiles = fs
			.readdirSync(imagesPath)
			.filter((file) => /\.(png|jpe?g|gif|webp)$/i.test(file));

		if (imageFiles.length === 0) {
			await interaction.reply('No Terry images were found.');
			return;
		}

		const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
		const randomImagePath = path.join(imagesPath, randomFile);

		await interaction.reply({ files: [randomImagePath] });
	},
};