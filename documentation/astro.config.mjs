// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Medialab Docs',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Eklista/medialab' }],
			sidebar: [
				{
				label: 'Inicio',
				link: '/',
				},
				{
				label: 'Documentación',
				autogenerate: { directory: 'architecture-overview' },
				},
				{
				label: 'Documentación Técnica',
				autogenerate: { directory: 'documentacion-tecnica' },
				},
			],
		}),
	],
});
