# Design System Master File — Jasdor Kopi Cima

> **DNA Visual:** Komik Doodle Stiker (Gaya Tahilalats / Mindblowon)
> Selaras dengan karakter maskot JasdorKopiCima (pria ceria + kucing oranye kacamata hitam).
> Setiap card, button, dan pill memiliki outline tegas dan hard offset shadow ala stiker komik pop.

---

**Project:** Jasdor Kopi Cima
**Generated / Updated:** 2026-10-17
**Style:** Comic Doodle / Pop Sticker (Tahilalats Inspired)
**Category:** Food Delivery / On-Demand Service

---

## Global Rules

### Color Palette

| Role | Hex | Tailwind Token | Catatan |
|------|-----|----------------|---------|
| Background Kertas | `#FAF4E8` | `bg-comic-paper` / `bg-[#FAF4E8]` | Warna dasar halaman ala kertas komik |
| Ink / Outline / Text | `#2B1D12` | `text-[#2B1D12]` / `border-[#2B1D12]` | Garis outline tebal 2px & teks utama |
| Ink Secondary | `#4A3628` | `text-[#4A3628]` | Teks sekunder / keterangan |
| Ink Muted | `#7A6658` | `text-[#7A6658]` | Teks bantuan / placeholder |
| Card Surface | `#FFFDF9` | `bg-[#FFFDF9]` | Warna latar kartu dengan kontras tinggi |
| Primary Accent | `#C67D0A` | `bg-[#C67D0A]` | Karamel hangat kopi Jasdor |
| Accent Hover | `#A66504` | `hover:bg-[#A66504]` | Hover karamel |
| Promo & Diskon | `#DC2626` | `text-[#DC2626]` / `bg-[#DC2626]` | Merah promo diskon 50% |
| Promo Bg/Tint | `#FEF2F2` | `bg-[#FEF2F2]` | Background badge promo |
| WhatsApp Hijau | `#15803D` | `bg-[#15803D]` | Tombol resmi checkout WhatsApp |
| WhatsApp Hover | `#166534` | `hover:bg-[#166534]` | Hover tombol WhatsApp |

### Badge Kategori Pastel (Border 2px Ink)

| Kategori | Background | Text & Border |
|----------|------------|---------------|
| Peach | `#FFE7D6` | `#2B1D12` |
| Mint | `#D9F3EA` | `#2B1D12` |
| Sky | `#DDF0FF` | `#2B1D12` |
| Butter | `#FFF0C2` | `#2B1D12` |
| Lavender | `#EFE4FF` | `#2B1D12` |

---

### Typography

- **Display Font:** Baloo 2 (`--font-baloo`, cursive/rounded bold) — Menggantikan Outfit untuk judul, angka, headline, dan nama brand.
- **Body Font:** Plus Jakarta Sans (`--font-jakarta`, clean sans-serif) — Keterangan, copy penjelasan, harga, dan input.
- **Hierarchy:**
  - H1 / Hero: 22px - 28px, Baloo 2 font-black, leading-tight
  - H2 / Section: 18px - 22px, Baloo 2 font-extrabold
  - H3 / Card Title: 15px - 17px, Baloo 2 font-bold
  - Body: 13px - 14px, Plus Jakarta Sans font-medium
  - Caption / Badges: 10px - 12px, font-bold uppercase tracking-wider

---

### Comic Hard Shadow Tokens

Gaya stiker komik Tahilalats menggunakan **hard offset shadow** (tanpa blur, solid ink `#2B1D12`):

```css
/* Card Pop Shadow */
box-shadow: 4px 4px 0px #2B1D12;

/* Button Pop Shadow */
box-shadow: 3px 3px 0px #2B1D12;

/* Small Tag / Pill Pop Shadow */
box-shadow: 2px 2px 0px #2B1D12;

/* Active / Pressed State */
transform: translate(2px, 2px);
box-shadow: 0px 0px 0px #2B1D12;
```

---

## Component Specs

### 1. Cards (Stiker Komik)
```html
<div class="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[4px_4px_0px_#2B1D12] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#2B1D12]">
  <!-- Konten Kartu -->
</div>
```

### 2. Primary Buttons (Ink Button)
```html
<button class="bg-[#2B1D12] text-[#FAF4E8] font-display font-bold px-4 py-2.5 rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#C67D0A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
  Pesan Sekarang
</button>
```

### 3. WhatsApp Action Button
```html
<a class="bg-[#15803D] hover:bg-[#166534] text-white font-display font-bold px-4 py-3 rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
  <!-- WhatsApp Icon --> Checkout via WhatsApp
</a>
```

### 4. Header Bar
- Logo: `public/logo-jasdorkopicima.png` (avatar lingkaran doodle Tahilalats).
- Border: `border-b-2 border-[#2B1D12]`.
- Background: `#FAF4E8` kertas komik.

---

## Aturan Khusus (Invariants)

1. **Harga & Diskon**: Tetap merah `#DC2626` untuk promo setengah harga.
2. **WhatsApp**: Tetap hijau resmi `#15803D`.
3. **Terminologi**: Wajib selalu "jasa order", DILARANG menggunakan "jastip".
4. **Copywriting**: Santai bahasa sehari-hari ("jajan hemat", "gak pake ribet", "anti boncos"), ramah, jelas, tanpa kata "independen", tanpa tanda em dash ("—").
5. **A11y**: Kontras teks min 4.5:1 terhadap background, touch target minimal 44x44px untuk elemen interaktif.
