
// ==========================================
// KONFIGURASI SUPABASE
// ==========================================

const SUPABASE_URL = "MASUKKAN_PROJECT_URL";
const SUPABASE_KEY = "MASUKKAN_PUBLISHABLE_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let dataMakanan = [];
let modeEdit = false;
let idEdit = null;

// FORMAT RUPIAH
function rupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka || 0);
}

// PESAN STATUS
function tampilStatus(pesan, jenis = "success") {
    const status = document.getElementById("status");

    status.className = "status " + jenis;
    status.textContent = pesan;

    setTimeout(() => {
        status.className = "status";
    }, 4000);
}

// SELECT DATA
async function tampilData() {
    const tbody = document.getElementById("tbody");

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="empty">Memuat data...</td>
        </tr>
    `;

    const { data, error } = await supabaseClient
        .from("makanan")
        .select("*")
        .order("id_makanan", { ascending: true });

    if (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty">Gagal memuat data</td>
            </tr>
        `;

        tampilStatus(error.message, "error");
        return;
    }

    dataMakanan = data || [];
    renderData();
    hitungStatistik();
}

// RENDER TABEL
function renderData() {
    const tbody = document.getElementById("tbody");
    const keyword = document.getElementById("search").value.toLowerCase();

    const filtered = dataMakanan.filter(item =>
        item.nama_makanan.toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty">Data tidak ditemukan</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${item.id_makanan}</td>
            <td>${escapeHTML(item.nama_makanan)}</td>
            <td>${rupiah(item.harga)}</td>
            <td>
                <div class="actions">
                    <button class="btn-edit"
                        onclick="editMakanan(${item.id_makanan})">
                        Edit
                    </button>

                    <button class="btn-delete"
                        onclick="hapusMakanan(${item.id_makanan})">
                        Hapus
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// AMANKAN TEKS
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

// STATISTIK
function hitungStatistik() {
    document.getElementById("totalProduk").textContent =
        dataMakanan.length;

    const total = dataMakanan.reduce((sum, item) => {
        return sum + Number(item.harga);
    }, 0);

    document.getElementById("totalHarga").textContent = rupiah(total);
}

// INSERT DAN UPDATE
document.getElementById("formMakanan")
.addEventListener("submit", async function(e) {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const harga = Number(document.getElementById("harga").value);

    if (!nama || harga < 0 || !Number.isFinite(harga)) {
        tampilStatus("Nama dan harga tidak valid!", "error");
        return;
    }

    const btn = document.getElementById("btnSimpan");
    btn.disabled = true;

    if (!modeEdit) {
        // INSERT
        const { error } = await supabaseClient
            .from("makanan")
            .insert([{ nama_makanan: nama, harga: harga }]);

        if (error) {
            tampilStatus(error.message, "error");
        } else {
            tampilStatus("Makanan berhasil ditambahkan!");
            this.reset();
            await tampilData();
        }
    } else {
        // UPDATE
        const { error } = await supabaseClient
            .from("makanan")
            .update({
                nama_makanan: nama,
                harga: harga
            })
            .eq("id_makanan", idEdit);

        if (error) {
            tampilStatus(error.message, "error");
        } else {
            tampilStatus("Data berhasil diedit!");
            batalEdit();
            await tampilData();
        }
    }

    btn.disabled = false;
    btn.textContent = modeEdit
        ? "Simpan Perubahan"
        : "Simpan Makanan";
}

// EDIT
function editMakanan(id) {
    const item = dataMakanan.find(m => m.id_makanan === id);

    if (!item) return;

    modeEdit = true;
    idEdit = id;

    document.getElementById("nama").value = item.nama_makanan;
    document.getElementById("harga").value = item.harga;

    document.getElementById("formTitle").textContent = "Edit Makanan";
    document.getElementById("btnSimpan").textContent = "Simpan Perubahan";
    document.getElementById("btnBatal").style.display = "inline-block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// BATAL EDIT
function batalEdit() {
    modeEdit = false;
    idEdit = null;

    document.getElementById("formMakanan").reset();
    document.getElementById("formTitle").textContent = "Tambah Makanan";
    document.getElementById("btnSimpan").textContent = "Simpan Makanan";
    document.getElementById("btnBatal").style.display = "none";
}

// DELETE
async function hapusMakanan(id) {
    const item = dataMakanan.find(m => m.id_makanan === id);

    if (!item) return;

    if (!confirm("Yakin ingin menghapus " + item.nama_makanan + "?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("makanan")
        .delete()
        .eq("id_makanan", id);

    if (error) {
        tampilStatus(error.message, "error");
    } else {
        tampilStatus("Makanan berhasil dihapus!");
        await tampilData();
    }
}

// PENCARIAN
document.getElementById("search")
.addEventListener("input", renderData);

// MULAI
tampilData();
