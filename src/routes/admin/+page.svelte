<script lang="ts">
	import {
		Lock,
		Plus,
		X,
		LoaderCircle,
		Trash2,
		Pencil,
		Pin,
		ExternalLink,
		ShieldCheck
	} from 'lucide-svelte';

	let pinInput = $state('');
	let pinError = $state('');
	let checking = $state(false);
	let isAdmin = $state(false);

	let links = $state<any[]>([]);
	let categories = $state<string[]>([]);
	let showForm = $state(false);
	let editingLink = $state<any | null>(null);
	let deletingId = $state('');

	// form state
	let form = $state({
		title: '',
		url: '',
		description: '',
		category: '',
		icon: '📁',
		is_pinned: false
	});

	$effect(() => {
		checkSession();
	});

	async function checkSession() {
		try {
			const resp = await fetch('/api/auth');
			const data = await resp.json();
			if (data.success && data.authenticated) {
				isAdmin = true;
				await fetchLinks();
			}
		} catch (e) {
			console.error(e);
		}
	}

	async function logout() {
		try {
			await fetch('/api/auth', { method: 'DELETE' });
		} catch (e) {
			console.error(e);
		}
		isAdmin = false;
		pinInput = '';
		pinError = '';
	}

	async function verifyPin(e: Event) {
		e.preventDefault();
		if (!/^\d{6}$/.test(pinInput)) {
			pinError = 'PIN harus tepat 6 digit angka.';
			return;
		}
		checking = true;
		pinError = '';
		try {
			const resp = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pin: pinInput })
			});
			const data = await resp.json();
			if (data.success) {
				isAdmin = true;
				await fetchLinks();
			} else {
				pinError = data.error ?? 'PIN salah.';
			}
		} catch (err) {
			console.error(err);
			pinError = 'Terjadi kesalahan jaringan.';
		}
		checking = false;
	}

	async function fetchLinks() {
		try {
			const resp = await fetch('/api/links');
			const data = await resp.json();
			if (data.success) {
				links = data.links ?? [];
				categories = data.categories ?? [];
			}
		} catch (e) {
			console.error(e);
		}
	}

	function openAddForm() {
		editingLink = null;
		form = { title: '', url: '', description: '', category: '', icon: '📁', is_pinned: false };
		showForm = true;
	}

	function openEditForm(link: any) {
		editingLink = link;
		form = {
			title: link.title ?? '',
			url: link.url ?? '',
			description: link.description ?? '',
			category: link.category ?? '',
			icon: link.icon ?? '📁',
			is_pinned: !!link.is_pinned
		};
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingLink = null;
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		try {
			const payload = {
				title: form.title.trim(),
				url: form.url.trim(),
				description: form.description.trim(),
				category: form.category.trim() || 'Umum',
				icon: form.icon.trim() || '📁',
				is_pinned: form.is_pinned
			};

			if (!payload.title || !payload.url) {
				alert('Judul dan URL wajib diisi');
				return;
			}

			if (editingLink) {
				const resp = await fetch('/api/links', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: editingLink.id, ...payload })
				});
				const data = await resp.json();
				if (!data.success) {
					alert(`Gagal update: ${data.error}`);
					return;
				}
			} else {
				const resp = await fetch('/api/links', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				const data = await resp.json();
				if (!data.success) {
					alert(`Gagal tambah: ${data.error}`);
					return;
				}
			}

			closeForm();
			await fetchLinks();
		} catch (err: any) {
			alert('Terjadi kesalahan: ' + err.message);
		}
	}

	async function deleteLink(id: string) {
		deletingId = id;
		try {
			const resp = await fetch('/api/links', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const data = await resp.json();
			if (data.success) {
				await fetchLinks();
			} else {
				alert(`Gagal hapus: ${data.error}`);
			}
		} catch (err: any) {
			alert('Terjadi kesalahan: ' + err.message);
		}
		deletingId = '';
	}

	async function togglePin(link: any) {
		try {
			const payload = {
				id: link.id,
				title: link.title,
				url: link.url,
				description: link.description,
				category: link.category,
				icon: link.icon,
				is_pinned: link.is_pinned ? 0 : 1
			};
			await fetch('/api/links', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			await fetchLinks();
		} catch (err: any) {
			alert('Gagal toggle pin: ' + err.message);
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-slate-950 text-slate-100">
	<header class="border-b border-slate-800/60 sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md">
		<div class="mx-auto max-w-5xl px-4 py-4 sm:py-5 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<img src="/gerlink-logo.png" alt="Logo Gerlink" class="h-10 w-10 rounded-lg bg-white object-contain p-1 sm:h-12 sm:w-12 sm:p-1.5" />
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white">
						<span class="text-cyan-400">Admin</span> Gerlink Drive Hub
					</h1>
					<p class="mt-0.5 text-xs text-slate-400">Kelola link &amp; dokumen</p>
				</div>
			</div>
			<a href="/" class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
				<ExternalLink size={14} /> Halaman Publik
			</a>
		</div>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
		{#if !isAdmin}
			<!-- PIN LOGIN FORM -->
			<div class="mx-auto max-w-sm rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
				<div class="mb-6 flex flex-col items-center justify-center">
					<span class="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
						<Lock size={24} />
					</span>
					<h2 class="mt-4 text-lg font-bold text-white">Login Admin</h2>
					<p class="mt-1 text-xs text-slate-400">Masukkan PIN 6 digit untuk mengelola</p>
				</div>
				<form onsubmit={verifyPin} class="space-y-4">
					<input
						type="password"
						bind:value={pinInput}
						maxlength="6"
						inputmode="numeric"
						placeholder="Masukkan 6 digit PIN"
						class="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 text-center text-lg tracking-widest text-white placeholder-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
						autofocus
						autocomplete="off"
						name="admin-pin-input"
					/>
					{#if pinInput && !/^\d{6}$/.test(pinInput)}
						<p class="text-xs text-rose-400">PIN harus 6 digit angka (contoh: 123456)</p>
					{/if}
					{#if pinError}
						<p class="text-xs text-rose-400">{pinError}</p>
					{/if}
					<button
						type="submit"
						disabled={checking}
						class="w-full rounded-lg bg-cyan-500 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2">
						{#if checking}<LoaderCircle size={16} class="animate-spin" />{/if}
						{checking ? 'Memverifikasi…' : 'Masuk'}
					</button>
				</form>
			</div>
		{:else}
			<!-- ADMIN DASHBOARD -->
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-2 text-xs text-slate-400">
					<ShieldCheck size={16} class="text-emerald-400" />
					Mode Admin Aktif
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={openAddForm}
						class="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400">
						<Plus size={16} /> Tambah Link
					</button>
					<button
						onclick={logout}
						class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-rose-500/50 hover:text-rose-400">
						<Lock size={14} /> Logout
					</button>
				</div>
			</div>

			<!-- FORM MODAL DRAWER -->
			{#if showForm}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
					<div class="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
						<button
							onclick={closeForm}
							class="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
							<X size={18} />
						</button>
						<h3 class="mb-4 text-lg font-bold text-white">
							{#if editingLink}<Pencil size={16} class="inline mr-1" /> Edit Link{:else}<Plus size={16} class="inline mr-1" /> Link Baru {/if}
						</h3>
						<form onsubmit={submitForm} class="space-y-3">
							<div>
								<label class="mb-1 block text-xs font-medium text-slate-400">Judul <span class="text-rose-400">*</span></label>
								<input
									bind:value={form.title}
									class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
									placeholder="Contoh: SOP Glescope V2"
									required
								/>
							</div>
							<div>
								<label class="mb-1 block text-xs font-medium text-slate-400">URL Google Drive / Tautan <span class="text-rose-400">*</span></label>
								<input
									bind:value={form.url}
									type="url"
									class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
									placeholder="https://drive.google.com/…"
									required
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="mb-1 block text-xs font-medium text-slate-400">Kategori</label>
									<input
										bind:value={form.category}
										class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
										placeholder="Umum"
									/>
								</div>
								<div>
									<label class="mb-1 block text-xs font-medium text-slate-400">Ikon (Emoji)</label>
									<input
										bind:value={form.icon}
										class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
									/>
								</div>
							</div>
							<div>
								<label class="mb-1 block text-xs font-medium text-slate-400">Deskripsi</label>
								<textarea
									bind:value={form.description}
									rows="2"
									class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
									placeholder="Deskripsi singkat…"
								></textarea>
							</div>
							<label class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 transition-colors hover:border-slate-700">
								<input
									type="checkbox"
									bind:checked={form.is_pinned}
									class="accent-cyan-500 h-4 w-4"
								/>
								<div>
									<span class="text-sm font-medium text-slate-200">Pinned</span>
									<p class="text-xs text-slate-500">Tampil di bagian atas daftar</p>
								</div>
							</label>
							<div class="flex gap-3 pt-2">
								<button
									type="button"
									onclick={closeForm}
									class="flex-1 rounded-lg border border-slate-700 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
									Batal
								</button>
								<button
									type="submit"
									class="flex-1 rounded-lg bg-cyan-500 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400">
									{#if editingLink}Simpan{:else}Tambah {/if}
								</button>
							</div>
						</form>
					</div>
				</div>
			{/if}

			<!-- LINK LIST -->
			{#if links.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-slate-500">
					<p class="text-lg font-medium text-slate-300">Belum ada link</p>
					<button
						onclick={openAddForm}
						class="mt-4 flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-colors">
						<Plus size={16} /> Tambah Pertama
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each links as link, idx}
						<div
							class="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700 sm:flex-row sm:items-center">
							<span class="text-2xl">{link.icon || '📁'}</span>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="truncate text-sm font-bold text-slate-100">{link.title}</h3>
									{#if link.category}
										<span class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{link.category}</span>
									{/if}
									{#if link.is_pinned}
										<Pin size={12} class="text-cyan-400" />
									{/if}
								</div>
								{#if link.description}
									<p class="mt-0.5 text-xs text-slate-500 line-clamp-1">{link.description}</p>
								{/if}
								<p class="mt-1 truncate text-[10px] text-slate-600 font-mono">{link.url}</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<button
									onclick={() => togglePin(link)}
									class="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:text-cyan-400 hover:border-cyan-500/50"
									title="Toggle Pinned">
									<Pin size={14} />
								</button>
								<button
									onclick={() => openEditForm(link)}
									class="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:text-emerald-400 hover:border-emerald-500/50"
									title="Edit">
									<Pencil size={14} />
								</button>
								<button
									onclick={() => deleteLink(link.id)}
									disabled={deletingId === link.id}
									class="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:text-rose-400 hover:border-rose-500/50 disabled:opacity-50"
									title="Hapus">
									{#if deletingId === link.id}<LoaderCircle size={14} class="animate-spin" />{:else}<Trash2 size={14} />{/if}
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</main>
	<footer class="border-t border-slate-800/60 py-6 text-center text-xs text-slate-600">
		Software Engineer RND Gerlink &copy; 2026
	</footer>
</div>
