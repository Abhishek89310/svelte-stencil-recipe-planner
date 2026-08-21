<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { registerRecipeUi } from '$lib/stencil';
	import { favorites } from '$lib/state/favorites.svelte';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { mealPlan } from '$lib/state/meal-plan.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let menuOpen = $state(false);

	// One registration for the whole application: the loader from the published
	// npm package defines every custom element the routes below rely on.
	onMount(() => {
		registerRecipeUi();
	});

	const links = $derived([
		{ href: '/', label: 'Discover', badge: 0 },
		{ href: '/favorites', label: 'Favourites', badge: favorites.count },
		{ href: '/my-recipes', label: 'My recipes', badge: myRecipes.count },
		{ href: '/planner', label: 'Planner', badge: mealPlan.plannedCount },
		{ href: '/about', label: 'About', badge: 0 }
	]);

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
	<div class="header-inner">
		<a class="brand" href="/" onclick={() => (menuOpen = false)}>
			<span class="brand-mark" aria-hidden="true">🍲</span>
			<span class="brand-text">
				<strong>Recipe Finder</strong>
				<small>&amp; Meal Planner</small>
			</span>
		</a>

		<button
			class="menu-toggle"
			type="button"
			aria-expanded={menuOpen}
			aria-controls="primary-nav"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="visually-hidden">{menuOpen ? 'Close' : 'Open'} navigation</span>
			<span class="bars" class:is-open={menuOpen} aria-hidden="true"></span>
		</button>

		<nav id="primary-nav" class="nav" class:is-open={menuOpen} aria-label="Primary">
			{#each links as link (link.href)}
				<a
					class="nav-link"
					class:is-active={isActive(link.href)}
					href={link.href}
					aria-current={isActive(link.href) ? 'page' : undefined}
					onclick={() => (menuOpen = false)}
				>
					{link.label}
					{#if link.badge > 0}
						<span class="nav-badge">{link.badge}</span>
					{/if}
				</a>
			{/each}
		</nav>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="site-footer">
	<div class="footer-inner">
		<p class="muted">
			Recipe data from
			<a href="https://www.themealdb.com" target="_blank" rel="noreferrer noopener">TheMealDB</a>.
			Favourites, your own recipes and the weekly plan are stored in this browser only.
		</p>
	</div>
</footer>

<Toaster />

<style>
	.skip-link {
		position: absolute;
		top: -100px;
		left: var(--ru-space-4);
		z-index: 100;
		padding: 10px 16px;
		background: var(--accent);
		color: var(--ru-color-text-inverse);
		border-radius: 0 0 var(--ru-radius-sm) var(--ru-radius-sm);
		font-weight: 600;
	}

	.skip-link:focus {
		top: 0;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--surface) 88%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border);
	}

	.header-inner {
		display: flex;
		align-items: center;
		gap: var(--ru-space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--ru-space-3) var(--ru-space-4);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--ru-space-2);
		color: var(--text);
		margin-right: auto;
	}

	.brand:hover {
		text-decoration: none;
	}

	.brand-mark {
		font-size: 1.5rem;
		line-height: 1;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}

	.brand-text strong {
		font-size: 1.0625rem;
		letter-spacing: -0.02em;
	}

	.brand-text small {
		font-size: 0.6875rem;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 13px;
		border-radius: var(--ru-radius-pill);
		color: var(--text-muted);
		font-size: var(--ru-font-size-md);
		font-weight: 550;
		transition:
			background var(--ru-transition),
			color var(--ru-transition);
	}

	.nav-link:hover {
		background: var(--surface-muted);
		color: var(--text);
		text-decoration: none;
	}

	.nav-link.is-active {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.nav-badge {
		min-width: 19px;
		height: 19px;
		padding: 0 5px;
		display: inline-grid;
		place-items: center;
		border-radius: var(--ru-radius-pill);
		background: var(--accent);
		color: var(--ru-color-text-inverse);
		font-size: 0.6875rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.nav-link.is-active .nav-badge {
		background: var(--accent);
	}

	.menu-toggle {
		display: none;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--ru-radius-sm);
		background: var(--surface);
		cursor: pointer;
		position: relative;
	}

	.bars,
	.bars::before,
	.bars::after {
		position: absolute;
		left: 11px;
		width: 16px;
		height: 2px;
		background: var(--text);
		border-radius: 2px;
		transition: transform var(--ru-transition);
	}

	.bars {
		top: 19px;
	}

	.bars::before,
	.bars::after {
		content: '';
		left: 0;
	}

	.bars::before {
		top: -5px;
	}

	.bars::after {
		top: 5px;
	}

	.bars.is-open {
		background: transparent;
	}

	.bars.is-open::before {
		transform: translateY(5px) rotate(45deg);
	}

	.bars.is-open::after {
		transform: translateY(-5px) rotate(-45deg);
	}

	main {
		min-height: 60vh;
	}

	.site-footer {
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.footer-inner {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--ru-space-5) var(--ru-space-4);
		font-size: var(--ru-font-size-sm);
	}

	@media (max-width: 780px) {
		.menu-toggle {
			display: block;
			order: 3;
		}

		.nav {
			display: none;
			order: 4;
			flex-basis: 100%;
			flex-direction: column;
			align-items: stretch;
			gap: 2px;
			padding-top: var(--ru-space-3);
		}

		.nav.is-open {
			display: flex;
		}

		.header-inner {
			flex-wrap: wrap;
		}

		.nav-link {
			border-radius: var(--ru-radius-sm);
			padding: 11px 13px;
		}
	}
</style>
