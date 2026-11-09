<script lang="ts">
	import {
		Search,
		Plus,
		ExternalLink,
		Pin,
		LoaderCircle,
		Lock,
		KeyRound,
		Eye,
		EyeOff
	} from 'lucide-svelte';

	let { data }: { data: { isUnlocked: boolean } } = $props();

	// Gate state
	let unlockedByUser = $state<boolean | null>(null);
	let isUnlocked = $derived(unlockedByUser !== null ? unlockedByUser : (data?.isUnlocked ?? false));

	let gatePin = $state('');
	let gateError = $state('');
	let gateLoading = $state(false);
	let showPin = $state(false);

	// Dashboard state
	let searchQuery = $state('');
	let selectedCat = $state('Semua');
	let links = $state<any[]>([]);
	let categories = $state<string[]>([]);
	let loading = $state(false);

	const filteredLinks = $derived(
		searchQuery || selectedCat !== 'Semua'
			? links.filter((l) => {
					const matchesQuery =
						!searchQuery ||
						l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(l.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
					const matchesCat = selectedCat === 'Semua' || l.category === selectedCat;
					return matchesQuery && matchesCat;
				})
			: links
	);

	$effect(() => {
		if (isUnlocked) {
			fetchLinks();
		}
	});

	async function unlockGate(e: Event) {
		e.preventDefault();
		const pinToVerify = gatePin.trim();
		if (!pinToVerify) {
			gateError = 'Silakan masukkan PIN akses.';
			return;
		}

		gateLoading = true;
		gateError = '';

		try {
			const resp = await fetch('/api/gate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pin: pinToVerify })
			});

			const res = await resp.json();

			if (resp.ok && res.success) {
				unlockedByUser = true;
				gatePin = '';
				gateError = '';
				await fetchLinks();
			} else {
				gateError = res.error ?? 'PIN salah. Silakan coba lagi.';
			}
		} catch (err: any) {
			console.error(err);
			gateError = 'Gagal memverifikasi PIN. Periksa koneksi jaringan.';
		} finally {
			gateLoading = false;
		}
	}

	async function lockGate() {
		try {
			await fetch('/api/gate', { method: 'DELETE' });
		} catch (e) {
			console.error(e);
		}
		unlockedByUser = false;
		links = [];
		categories = [];
		gatePin = '';
		gateError = '';
	}

	async function fetchLinks() {
		loading = true;
		try {
			const resp = await fetch(
				`/api/links?q=${encodeURIComponent(searchQuery)}&cat=${encodeURIComponent(selectedCat)}`
			);
			const data = await resp.json();
			if (data.success) {
				links = data.links ?? [];
				categories = data.categories ?? [];
			} else if (resp.status === 401) {
				unlockedByUser = false;
			}
		} catch (e) {
			console.error(e);
		}
		loading = false;
	}

	function formatDate(unix: number | string | null | undefined) {
		if (!unix) return '';
		const d = new Date(Number(unix) * 1000);
		return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div class="flex min-h-screen flex-col bg-slate-950 text-slate-100">
	{#if !isUnlocked}
		<!-- GATE / PIN LOCK SCREEN -->
		<div class="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
			<div class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
				<div class="mb-6 flex flex-col items-center text-center">
					<div class="relative mb-4">
						<img
							src="/gerlink-logo.png"
							alt="Logo Gerlink"
							class="h-16 w-16 rounded-2xl bg-white object-contain p-2 shadow-lg shadow-cyan-500/10"
						/>
						<span
							class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-md"
							title="Dilindungi PIN"
						>
							<Lock size={13} />
						</span>
					</div>
					<h1 class="text-2xl font-bold tracking-tight text-white">
						<span class="text-cyan-400">Gerlink</span> Drive Hub
					</h1>
					<p class="mt-2 text-xs text-slate-400">
						Kumpulan dokumen &amp; tautan internal. Silakan masukkan PIN akses untuk membuka.
					</p>
				</div>

				<form onsubmit={unlockGate} class="space-y-4">
					<div>
						<label for="gate-pin-input" class="mb-1.5 block text-xs font-medium text-slate-300">
							PIN Akses
						</label>
						<div class="relative">
							<input
								id="gate-pin-input"
								type={showPin ? 'text' : 'password'}
								bind:value={gatePin}
								placeholder="Masukkan PIN akses…"
								class="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-4 pr-11 text-sm text-white placeholder-slate-600 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
								autocomplete="current-password"
							/>
							<button
								type="button"
								onclick={() => (showPin = !showPin)}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
								aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
							>
								{#if showPin}
									<EyeOff size={18} />
								{:else}
									<Eye size={18} />
								{/if}
							</button>
						</div>
					</div>

					{#if gateError}
						<div class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 flex items-center gap-2">
							<span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
							<span>{gateError}</span>
						</div>
					{/if}

					<button
						type="submit"
						disabled={gateLoading}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-md shadow-cyan-500/20"
					>
						{#if gateLoading}
							<LoaderCircle size={16} class="animate-spin" />
							<span>Memverifikasi…</span>
						{:else}
							<KeyRound size={16} />
							<span>Buka Akses</span>
						{/if}
					</button>

					<div class="pt-2 text-center text-[11px] text-slate-500">
						<p>Sesi login akan disimpan di perangkat ini selama 7 hari.</p>
					</div>
				</form>

				<div class="mt-6 border-t border-slate-800/80 pt-4 text-center">
					<a
						href="/admin"
						class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
					>
						<span>Pengelola sistem?</span>
						<span class="font-medium text-cyan-400 underline underline-offset-4">Login Admin &rarr;</span>
					</a>
				</div>
			</div>
		</div>
	{:else}
		<!-- UNLOCKED MAIN PAGE -->
		<header class="border-b border-slate-800/60 sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md">
			<div class="mx-auto max-w-5xl px-4 py-4 sm:py-5">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-3">
						<img
							src="/gerlink-logo.png"
							alt="Logo Gerlink"
							class="h-10 w-10 rounded-lg bg-white object-contain p-1 sm:h-12 sm:w-12 sm:p-1.5"
						/>
						<div>
							<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white">
								<span class="text-cyan-400">Gerlink</span> Drive Hub
							</h1>
							<p class="mt-0.5 text-xs text-slate-400">Kumpulan link &amp; dokumen penting</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<a
							href="/admin"
							class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 w-fit bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-cyan-500/50"
						>
							<Plus size={14} /> Kelola Link
						</a>
						<button
							onclick={lockGate}
							class="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 w-fit bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-rose-500/50"
							title="Kunci Akses Kembali"
						>
							<Lock size={13} /> Kunci
						</button>
					</div>
				</div>
				<div class="mt-4 flex flex-col gap-3 sm:flex-row">
					<div class="relative flex-1">
						<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
						<input
							type="search"
							bind:value={searchQuery}
							placeholder="Cari link, dokumen, kategori…"
							class="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
						/>
					</div>
					<div class="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
						<button
							onclick={() => (selectedCat = 'Semua')}
							class="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors
								{selectedCat === 'Semua'
									? 'bg-cyan-500 text-slate-950'
									: 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
						>
							Semua
						</button>
						{#each categories as cat}
							<button
								onclick={() => (selectedCat = cat)}
								class="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors
									{selectedCat === cat
										? 'bg-cyan-500 text-slate-950'
										: 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
							>
								{cat}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</header>

		<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
			{#if loading}
				<div class="flex flex-col items-center justify-center py-20 text-slate-500">
					<LoaderCircle size={32} class="animate-spin" />
					<p class="mt-3 text-sm">Memuat link…</p>
				</div>
			{:else if filteredLinks.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-slate-500">
					<p class="text-lg font-medium text-slate-300">Belum ada link ditemukan</p>
					<p class="mt-1 text-sm">
						{searchQuery || selectedCat !== 'Semua'
							? 'Coba ubah kata kunci atau filter kategori.'
							: 'Klik "Kelola Link" di atas untuk menambah link pertama.'}
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredLinks as link}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 transition-all hover:border-cyan-500/50 hover:bg-slate-900 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
						>
							{#if link.is_pinned}
								<div class="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
									<Pin size={10} /> Pinned
								</div>
							{/if}
							<div class="mb-3 flex items-start gap-3">
								<span class="text-3xl leading-none" aria-hidden="true">{link.icon || '📁'}</span>
								<div class="min-w-0 flex-1">
									<h3 class="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
										{link.title}
									</h3>
									{#if link.category}
										<span class="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
											{link.category}
										</span>
									{/if}
								</div>
							</div>
							{#if link.description}
								<p class="mb-3 text-xs leading-relaxed text-slate-400 line-clamp-2">{link.description}</p>
							{/if}
							<div class="flex items-center justify-between text-[11px] text-slate-500">
								{#if link.created_at}
									<span>Tgl {formatDate(link.created_at)}</span>
								{/if}
								<span class="flex items-center gap-1 transition-colors group-hover:text-cyan-400">
									Buka <ExternalLink size={12} />
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</main>
	{/if}

	<footer class="border-t border-slate-800/60 py-6 text-center text-xs text-slate-600">
		Software Engineer RND Gerlink &copy; 2026
	</footer>
</div>

<style>
	.no-scrollbar {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
