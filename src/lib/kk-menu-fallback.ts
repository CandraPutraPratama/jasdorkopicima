import type {
  MenuGroup,
  Product,
  ProductOptionDetails,
  VariantDimension,
  VariantSku,
  Addon,
} from '../types/domain.ts';
import { getSupabaseServerClient } from './supabase-server.ts';
import { isFoodOrNonCustomizableProduct, getSynthesizedNonCustomizableOptions } from './product-customization.ts';
import { getKkMenuDescription } from './kk-menu-descriptions.ts';

/**
 * Menu fallback resmi Kopi Kenangan (6 kategori, 86 produk).
 * Digunakan saat KK API query_web_order_product_menu tidak dapat dijangkau
 * atau saat outlet belum memiliki snapshot di generic_cache.
 */
export const KOPI_KENANGAN_FALLBACK_MENU: MenuGroup[] = [
  {
    "code": "ArenSeries",
    "name": "Baru!",
    "products": [
      {
        "id": 12383,
        "bundleCode": "1269751",
        "productCode": "1269751000",
        "name": "Taro Cloud Matcha",
        "description": "Perpaduan high quality matcha powder, susu, dan taro macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      },
      {
        "id": 12381,
        "bundleCode": "9590924",
        "productCode": "9590924000",
        "name": "Taro Milk",
        "description": "Perpaduan high quality taro powder dengan susu",
        "image": "https://gambar.cimagroup.my.id/product/d388cac3-16df-4519-9e80-f8ef633048b9.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      },
      {
        "id": 12382,
        "bundleCode": "7245645",
        "productCode": "7245645000",
        "name": "Taro Cloud Latte",
        "description": "Perpaduan espresso, susu, sirup hazelnut, dan taro macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/73af63fc-8f5c-48c0-aece-da0307e77af8.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      },
      {
        "id": 12380,
        "bundleCode": "8056833",
        "productCode": "8056833000",
        "name": "Taro Cloud Milk Tea",
        "description": "Perpaduan black tea, susu, dan taro macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/72c9b4d3-a487-457d-8e94-060d3aee9b1e.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      },
      {
        "id": 12371,
        "bundleCode": "5641200",
        "productCode": "5641200000",
        "name": "Triple Cheese Bagel",
        "description": "Roti bagel bercita rasa keju dari keju parmesan dengan topping keju mozarella dan lelehan keju cheddar",
        "image": "https://gambar.cimagroup.my.id/product/186b5436-c2a5-4b4e-bef4-319943616c12.jpg",
        "basePrice": 18000,
        "originalPrice": 18000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      },
      {
        "id": 12372,
        "bundleCode": "3373629",
        "productCode": "3373629000",
        "name": "Beef & Cheese Jalapeño Bagel",
        "description": "Roti bagel topping irisan cabai jalapeño & keju cheddar parut dengan isian smoked beef, sesame mayo & caramelized onion",
        "image": "https://gambar.cimagroup.my.id/product/f5239e58-8fa7-4eac-84d9-3c66b8cd059e.jpg",
        "basePrice": 20000,
        "originalPrice": 20000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      },
      {
        "id": 12370,
        "bundleCode": "6493381",
        "productCode": "6493381000",
        "name": "Double Choco Bagel",
        "description": "Roti bagel bercita rasa coklat dengan topping choco chip dan isian choco spread",
        "image": "https://gambar.cimagroup.my.id/product/63681082-b5b6-4943-b58b-96c6b8c64734.jpg",
        "basePrice": 18000,
        "originalPrice": 18000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Baru!"
      }
    ]
  },
  {
    "code": "Menu0002",
    "name": "Coffee",
    "products": [
      {
        "id": 12382,
        "bundleCode": "7245645",
        "productCode": "7245645000",
        "name": "Taro Cloud Latte",
        "description": "Perpaduan espresso, susu, sirup hazelnut, dan taro macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/73af63fc-8f5c-48c0-aece-da0307e77af8.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 12040,
        "bundleCode": "1778661",
        "productCode": "1778661000",
        "name": "Korean Banana Latte",
        "description": "Perpaduan banana sauce, oatmilk, espresso dan gula aren asli Indonesia",
        "image": "https://gambar.cimagroup.my.id/product/abf8f929-2d72-42ef-a05d-ebeadec7bb75.jpg",
        "basePrice": 23000,
        "originalPrice": 23000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 12041,
        "bundleCode": "4701583",
        "productCode": "4701583000",
        "name": "Banana Americano",
        "description": "Perpaduan banana sauce, espresso dan air mineral",
        "image": "https://gambar.cimagroup.my.id/product/c0442198-2f86-4d81-9a55-9aaf35019b92.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 12088,
        "bundleCode": "7505548",
        "productCode": "7505548000",
        "name": "Creamy Caramel Latte",
        "description": "",
        "image": "https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/f836a951-4960-43bb-b51c-a692c4b840ad?",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 11410,
        "bundleCode": "2111467",
        "productCode": "2111467000",
        "name": "OG Aren Speculoos Latte",
        "description": "Perpaduan espresso, susu, sirup speculoos, gula aren asli Indonesia dan topping speculoos cookie crumble",
        "image": "https://gambar.cimagroup.my.id/product/10c984f9-994b-4d97-8e29-164354598e22.jpg",
        "basePrice": 21000,
        "originalPrice": 21000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 11411,
        "bundleCode": "8954182",
        "productCode": "8954182000",
        "name": "Dua Shot OG Aren",
        "description": "Perpaduan dua shot espresso, susu, gula aren asli Indonesia dan topping speculoos cookie crumble",
        "image": "https://gambar.cimagroup.my.id/product/7c81b141-162c-4d41-8285-674283926e56.jpg",
        "basePrice": 25000,
        "originalPrice": 25000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 10603,
        "bundleCode": "1913244",
        "productCode": "1913244000",
        "name": "Pistachio Aren Latte",
        "description": "Perpaduan espresso, saus pistachio, gula aren asli Indonesia dan susu",
        "image": "https://gambar.cimagroup.my.id/product/392219eb-08e1-daf9-69d6-a12a8242e5be.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9880,
        "bundleCode": "9764593",
        "productCode": "9764593000",
        "name": "Cafe Malt Latte",
        "description": "Perpaduan espresso dari 100% biji kopi arabika Bali Kintamani, Oatside, dan sirup hazelnut",
        "image": "https://gambar.cimagroup.my.id/product/4c582a52-fbc8-2d9e-0007-f6a1c0b5fed6.jpg",
        "basePrice": 23000,
        "originalPrice": 23000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9645,
        "bundleCode": "7833007",
        "productCode": "7833007000",
        "name": "Kopi Kenangan Mantan",
        "description": "Kopi susu dengan gula aren asli Indonesia",
        "image": "https://gambar.cimagroup.my.id/product/da484154-47b1-a756-54a4-8b3490fb0eae.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9818,
        "bundleCode": "1771127",
        "productCode": "1771127000",
        "name": "Caramel Latte",
        "description": "Espresso, susu dan sirup karamel",
        "image": "https://gambar.cimagroup.my.id/product/630c892e-17a7-0d8c-301f-9e2d33bf1de8.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9821,
        "bundleCode": "5700547",
        "productCode": "5700547000",
        "name": "Dua Shot Iced Shaken",
        "description": "Dua shot espresso dengan susu",
        "image": "https://gambar.cimagroup.my.id/product/82e14825-c028-65d6-0c70-c352639bcf23.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9820,
        "bundleCode": "7958284",
        "productCode": "7958284000",
        "name": "Caramel Macchiato",
        "description": "Espresso, susu, saus salted caramel dan macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/821509a2-815f-3349-896c-9d15f787ab37.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9822,
        "bundleCode": "3759680",
        "productCode": "3759680000",
        "name": "Hazelnut Latte",
        "description": "Perpaduan espresso, susu, sirup hazelnut dan vanilla",
        "image": "https://gambar.cimagroup.my.id/product/5ac8e750-455e-dcf6-a4e4-5fb398bb25bb.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9823,
        "bundleCode": "3394640",
        "productCode": "3394640000",
        "name": "Kopi Susu Black Aren",
        "description": "Racikan kopi susu dengan kemewahan rasa gula aren yang lebih kuat & nikmat",
        "image": "https://gambar.cimagroup.my.id/product/2ba99b9b-7912-397a-9fea-a21d4073a197.jpg",
        "basePrice": 21000,
        "originalPrice": 21000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9827,
        "bundleCode": "7494662",
        "productCode": "7494662000",
        "name": "Matcha Espresso",
        "description": "Perpaduan espresso, susu dan high quality matcha powder",
        "image": "https://gambar.cimagroup.my.id/product/20738f57-23ed-ea72-85f3-cdd8bc468352.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9829,
        "bundleCode": "1384426",
        "productCode": "1384426000",
        "name": "Mocha Latte",
        "description": "Perpaduan espresso, susu dan dutch chocolate",
        "image": "https://gambar.cimagroup.my.id/product/92fe7698-7b99-9b4b-39db-8b01557fecb3.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9830,
        "bundleCode": "9903149",
        "productCode": "9903149000",
        "name": "Vanilla Latte",
        "description": "Perpaduan espresso, susu dan sirup vanilla",
        "image": "https://gambar.cimagroup.my.id/product/6831574a-3d7f-d543-9a0c-bd68e7dcb54a.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9831,
        "bundleCode": "2895061",
        "productCode": "2895061000",
        "name": "Avocado Coffee",
        "description": "Perpaduan alpukat, espresso dan susu",
        "image": "https://gambar.cimagroup.my.id/product/24081765-c705-34a8-eccb-ebccf7f7ae5a.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9851,
        "bundleCode": "9602810",
        "productCode": "9602810000",
        "name": "Spanish Latte",
        "description": "Perpaduan espresso, susu dan susu kental manis",
        "image": "https://gambar.cimagroup.my.id/product/e3aa23b8-278d-54a0-0769-0de6e82b4d60.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9849,
        "bundleCode": "9840203",
        "productCode": "9840203000",
        "name": "Creamy Aren Latte",
        "description": "Perpaduan espresso, susu creamy dan gula aren asli Indonesia",
        "image": "https://gambar.cimagroup.my.id/product/34ac251c-14e6-44b7-d2b9-b4c63f6e2136.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9852,
        "bundleCode": "6100292",
        "productCode": "6100292000",
        "name": "Butterscotch Aren Latte",
        "description": "Perpaduan Susu, Espresso, Sea Salt, Gula Aren Asli dan Sirup Butterscotch",
        "image": "https://gambar.cimagroup.my.id/product/a1cb7272-f6e2-bb69-950d-59bc87515fd2.jpg",
        "basePrice": 20000,
        "originalPrice": 20000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9853,
        "bundleCode": "6960127",
        "productCode": "6960127000",
        "name": "Butterscotch Sea Salt Latte",
        "description": "Perpaduan susu, espresso, sea salt dan sirup butterscotch dengan topping sea salt macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/e72f731f-d24e-7fed-372b-86eb398a0d22.jpg",
        "basePrice": 25000,
        "originalPrice": 25000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 10014,
        "bundleCode": "4021465",
        "productCode": "4021465000",
        "name": "Americano",
        "description": "Kopi hitam dari espresso dan air mineral",
        "image": "https://gambar.cimagroup.my.id/product/36155ddd-784d-a7d9-4d02-13d596417078.jpg",
        "basePrice": 17000,
        "originalPrice": 17000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 10017,
        "bundleCode": "8188474",
        "productCode": "8188474000",
        "name": "Cappuccino",
        "description": "Espresso, susu steamed, buih susu",
        "image": "https://gambar.cimagroup.my.id/product/8a0d42d0-4801-ca84-48e9-7b434b22aee4.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 10018,
        "bundleCode": "2653593",
        "productCode": "2653593000",
        "name": "Latte",
        "description": "Espresso dengan susu steamed",
        "image": "https://gambar.cimagroup.my.id/product/7b33aac1-3e8a-f15d-bb58-158692adf173.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9883,
        "bundleCode": "3147103",
        "productCode": "3147103000",
        "name": "Oatside Latte",
        "description": "Perpaduan espresso dan Oatside",
        "image": "https://gambar.cimagroup.my.id/product/4890326b-b307-b2f8-a6f1-1a6ae4b15804.jpg",
        "basePrice": 25000,
        "originalPrice": 25000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      },
      {
        "id": 9882,
        "bundleCode": "1458627",
        "productCode": "1458627000",
        "name": "Oatside Kopi Kenangan Mantan",
        "description": "Perpaduan espresso, Oatside dan gula aren asli Indonesia",
        "image": "https://gambar.cimagroup.my.id/product/c651acb8-3df7-7b75-45e2-f207926d863a.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Coffee"
      }
    ]
  },
  {
    "code": "Menu0003",
    "name": "Non Coffee",
    "products": [
      {
        "id": 12383,
        "bundleCode": "1269751",
        "productCode": "1269751000",
        "name": "Taro Cloud Matcha",
        "description": "Perpaduan high quality matcha powder, susu, dan taro macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 12381,
        "bundleCode": "9590924",
        "productCode": "9590924000",
        "name": "Taro Milk",
        "description": "Perpaduan high quality taro powder dengan susu",
        "image": "https://gambar.cimagroup.my.id/product/d388cac3-16df-4519-9e80-f8ef633048b9.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 12380,
        "bundleCode": "8056833",
        "productCode": "8056833000",
        "name": "Taro Cloud Milk Tea",
        "description": "Perpaduan black tea, susu, dan taro macchiato cream",
        "image": "https://gambar.cimagroup.my.id/product/72c9b4d3-a487-457d-8e94-060d3aee9b1e.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 12042,
        "bundleCode": "2662471",
        "productCode": "2662471000",
        "name": "Banana Choco",
        "description": "Perpaduan banana sauce, choco powder, susu dan gula aren asli Indonesia",
        "image": "https://gambar.cimagroup.my.id/product/dda71d19-28a8-4737-95da-fdb94a44892e.jpg",
        "basePrice": 24000,
        "originalPrice": 24000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 11647,
        "bundleCode": "2055831",
        "productCode": "2055831000",
        "name": "OG Thai Tea",
        "description": "Perpaduan teh khas Thailand dan susu",
        "image": "https://gambar.cimagroup.my.id/product/4f6889ec-6103-4fa0-a447-b7b3ee2742c9.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 11650,
        "bundleCode": "1379233",
        "productCode": "1379233002",
        "name": "Thai Tea Loaded",
        "description": "Perpaduan teh khas Thailand, susu, macchiato cream dengan grass jelly dan topping cookie crumble",
        "image": "https://gambar.cimagroup.my.id/product/6663aa38-c764-4ead-9db4-5a79634e9a77.jpg",
        "basePrice": 27000,
        "originalPrice": 27000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 11413,
        "bundleCode": "6307883",
        "productCode": "6307883000",
        "name": "OG Aren Milky Speculoos",
        "description": "Perpaduan susu, sirup speculoos, gula aren asli Indonesia dan topping speculoos cookie crumble",
        "image": "https://gambar.cimagroup.my.id/product/31e167f1-1598-481d-adb9-48669769854b.jpg",
        "basePrice": 23000,
        "originalPrice": 23000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 10218,
        "bundleCode": "3714392",
        "productCode": "3714392000",
        "name": "Butterscotch Sea Salt Crumble",
        "description": "",
        "image": "https://gambar.cimagroup.my.id/product/032d2ddc-8df7-6d63-4101-1ccb50298085.jpg",
        "basePrice": 22000,
        "originalPrice": 22000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 10219,
        "bundleCode": "1169082",
        "productCode": "1169082000",
        "name": "Milk Oreo Crumble",
        "description": "Ice blended susu dengan taburan oreo",
        "image": "https://gambar.cimagroup.my.id/product/d27c63d0-4931-60fd-5eec-0963bdf095fc.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9837,
        "bundleCode": "3351380",
        "productCode": "3351380000",
        "name": "Babyccino",
        "description": "Perpaduan susu dan sirup karamel dengan topping foam dan saus karamel",
        "image": "https://gambar.cimagroup.my.id/product/afd5cdf3-964b-a63a-6db2-fb8c08410c61.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9843,
        "bundleCode": "7693496",
        "productCode": "7693496002",
        "name": "Fresh Lemonade",
        "description": "",
        "image": "https://gambar.cimagroup.my.id/product/a68ad5fc-839b-e7b4-c502-8535f7e76e55.jpg",
        "basePrice": 17000,
        "originalPrice": 17000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9835,
        "bundleCode": "8689856",
        "productCode": "8689856000",
        "name": "Avocado Caramel",
        "description": "Perpaduan alpukat, susu dan saus karamel",
        "image": "https://gambar.cimagroup.my.id/product/b5179af7-1dd7-aa4e-09f6-e1a1c8295602.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9836,
        "bundleCode": "9536776",
        "productCode": "9536776000",
        "name": "Avocado Milk",
        "description": "Perpaduan alpukat dengan susu",
        "image": "https://gambar.cimagroup.my.id/product/9f2e7aa5-3c8a-24cf-5944-84a5cc8d4cc8.jpg",
        "basePrice": 24000,
        "originalPrice": 24000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9838,
        "bundleCode": "1515179",
        "productCode": "1515179000",
        "name": "Caramel Dutch Choco",
        "description": "Perpaduan dutch chocolate, susu dan sirup karamel",
        "image": "https://gambar.cimagroup.my.id/product/c241a3f5-7e20-25be-a067-76170345d684.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9839,
        "bundleCode": "3931425",
        "productCode": "3931425000",
        "name": "Dutch Chocolate",
        "description": "Perpaduan dutch chocolate dengan susu",
        "image": "https://gambar.cimagroup.my.id/product/e7dfc639-f112-28b7-4cff-8e1cda6f82b5.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9841,
        "bundleCode": "8593772",
        "productCode": "8593772000",
        "name": "Hazelnut Dutch Choco",
        "description": "Perpaduan dutch chocolate, sirup hazelnut dan susu",
        "image": "https://gambar.cimagroup.my.id/product/d1e575af-ee5a-bbf7-0e41-915c0e5f93d6.jpg",
        "basePrice": 28000,
        "originalPrice": 28000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9842,
        "bundleCode": "8734620",
        "productCode": "8734620000",
        "name": "Lemon Black Tea",
        "description": "Black tea dengan lemon",
        "image": "https://gambar.cimagroup.my.id/product/3be29e5b-7a9d-8cb5-1d97-9667d92378f9.jpg",
        "basePrice": 17000,
        "originalPrice": 17000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9844,
        "bundleCode": "1608769",
        "productCode": "1608769000",
        "name": "Kenangan Milk Tea",
        "description": "Perpaduan black tea dengan susu",
        "image": "https://gambar.cimagroup.my.id/product/5a15d4ef-582c-1391-5e58-e523d6b87398.jpg",
        "basePrice": 21000,
        "originalPrice": 21000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9846,
        "bundleCode": "5008474",
        "productCode": "5008474000",
        "name": "Milo Dinosaurus",
        "description": "Susu milo dengan taburan bubuk milo",
        "image": "https://gambar.cimagroup.my.id/product/658f1737-546d-133b-ac36-aea2f524920c.jpg",
        "basePrice": 23000,
        "originalPrice": 23000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9854,
        "bundleCode": "3806931",
        "productCode": "3806931000",
        "name": "Oreo Shake",
        "description": "Susu vanilla dengan remah Oreo",
        "image": "https://gambar.cimagroup.my.id/product/8c0d86d6-3c45-8c5e-4679-ae4f6d935583.jpg",
        "basePrice": 26000,
        "originalPrice": 26000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9855,
        "bundleCode": "4740155",
        "productCode": "4740155000",
        "name": "Raspberry Hibiscus",
        "description": "Teh buah raspberry hibiscus dan lemon",
        "image": "https://gambar.cimagroup.my.id/product/615287c4-c7a7-272c-c38e-df0c89886391.jpg",
        "basePrice": 20000,
        "originalPrice": 20000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9857,
        "bundleCode": "8621085",
        "productCode": "8621085000",
        "name": "Susu Grass Jelly",
        "description": "Perpaduan susu dengan gula aren asli Indonesia dengan tambahan grass jelly",
        "image": "https://gambar.cimagroup.my.id/product/9717e724-83d5-7c5f-55b9-efbb1b2a7864.jpg",
        "basePrice": 24000,
        "originalPrice": 24000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9861,
        "bundleCode": "8101210",
        "productCode": "8101210000",
        "name": "Matcha Latte",
        "description": "Perpaduan susu dengan high quality matcha powder",
        "image": "https://gambar.cimagroup.my.id/product/97f5cfe8-ad68-1598-9430-1b5f732deedc.jpg",
        "basePrice": 25000,
        "originalPrice": 25000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9864,
        "bundleCode": "2763964",
        "productCode": "2763964000",
        "name": "Oatside Matcha Latte",
        "description": "Perpaduan high quality matcha powder dan Oatside",
        "image": "https://gambar.cimagroup.my.id/product/d048cf0f-ed3f-8b76-26b0-75f651fe5dc7.jpg",
        "basePrice": 25000,
        "originalPrice": 25000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      },
      {
        "id": 9870,
        "bundleCode": "4306862",
        "productCode": "4306862000",
        "name": "Air Mineral",
        "description": "Air Mineral",
        "image": "https://gambar.cimagroup.my.id/product/a05ec204-65cd-2025-adcf-c7f141ce21c3.jpg",
        "basePrice": 9000,
        "originalPrice": 9000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Non Coffee"
      }
    ]
  },
  {
    "code": "APPFRAPPESERIES",
    "name": "Kenangan Frappe",
    "products": [
      {
        "id": 10019,
        "bundleCode": "4187986",
        "productCode": "4187986000",
        "name": "Butterscotch Kenangan Frappe",
        "description": "Ice blended kopi susu dan saus Butterscotch dengan whipped cream vanilla / chocolate dan topping caramel crumble",
        "image": "https://gambar.cimagroup.my.id/product/36ac278e-5212-00b3-ce73-e347a88b0372.jpg",
        "basePrice": 30000,
        "originalPrice": 30000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Frappe"
      },
      {
        "id": 10020,
        "bundleCode": "8272775",
        "productCode": "8272775000",
        "name": "Matcha Kenangan Frappe",
        "description": "Ice blended high quality matcha powder dengan whipped cream vanilla / chocolate & taburan matcha powder di atasnya",
        "image": "https://gambar.cimagroup.my.id/product/f3c9aacf-fbae-370a-082d-9e719e4909e7.jpg",
        "basePrice": 32000,
        "originalPrice": 32000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Frappe"
      },
      {
        "id": 10015,
        "bundleCode": "9318104",
        "productCode": "9318104000",
        "name": "Kopi Kenangan Mantan Frappe",
        "description": "Ice blended kopi susu gula aren, whipped cream vanilla / chocolate dan saus gula aren",
        "image": "https://gambar.cimagroup.my.id/product/18899b9c-b242-468f-1839-c096e27b0225.jpg",
        "basePrice": 27000,
        "originalPrice": 27000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Frappe"
      },
      {
        "id": 10016,
        "bundleCode": "5865175",
        "productCode": "5865175000",
        "name": "Vanilla Kenangan Frappe",
        "description": "Ice blended rasa vanilla dengan whipped cream vanilla / chocolate",
        "image": "https://gambar.cimagroup.my.id/product/839fa121-427c-110e-6550-479d604d1f2d.jpg",
        "basePrice": 25000,
        "originalPrice": 25000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Frappe"
      },
      {
        "id": 9892,
        "bundleCode": "7054742",
        "productCode": "7054742000",
        "name": "Dutch Choco Kenangan Frappe",
        "description": "Ice blended dengan rasa dutch chocolate, whipped cream vanilla / cokelat dan saus coklat",
        "image": "https://gambar.cimagroup.my.id/product/0bf0ec79-18a9-414f-4b7e-e50b940495bf.jpg",
        "basePrice": 29000,
        "originalPrice": 29000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Frappe"
      }
    ]
  },
  {
    "code": "TOAST",
    "name": "Kenangan Toast",
    "products": [
      {
        "id": 5915,
        "bundleCode": "1736117",
        "productCode": "1736117000",
        "name": "Bambang Choco Cheese Toast",
        "description": "Roti toast tebal dengan isi krim coklat, keju slice & topping susu kental manis",
        "image": "https://gambar.cimagroup.my.id/product/bccc5e24-0e25-1a67-1361-5b22783c1833.jpg",
        "basePrice": 17000,
        "originalPrice": 17000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Toast"
      },
      {
        "id": 5918,
        "bundleCode": "8355692",
        "productCode": "8355692000",
        "name": "Adam Ayam Toast",
        "description": "Roti toast tebal dengan isi daging luncheon ayam, keju slice, ditambah topping",
        "image": "https://gambar.cimagroup.my.id/product/79146711-94ca-c5cf-8b18-11205acac4b7.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Toast"
      },
      {
        "id": 5917,
        "bundleCode": "9341610",
        "productCode": "9341610000",
        "name": "Wahyu Sapi Toast",
        "description": "Roti toast tebal dengan isi daging luncheon sapi, keju slice, ditambah topping",
        "image": "https://gambar.cimagroup.my.id/product/9844851e-1ef8-dc73-309f-24bad50dffab.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Kenangan Toast"
      }
    ]
  },
  {
    "code": "Group0005",
    "name": "Food",
    "products": [
      {
        "id": 12371,
        "bundleCode": "5641200",
        "productCode": "5641200000",
        "name": "Triple Cheese Bagel",
        "description": "Roti bagel bercita rasa keju dari keju parmesan dengan topping keju mozarella dan lelehan keju cheddar",
        "image": "https://gambar.cimagroup.my.id/product/186b5436-c2a5-4b4e-bef4-319943616c12.jpg",
        "basePrice": 18000,
        "originalPrice": 18000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 12372,
        "bundleCode": "3373629",
        "productCode": "3373629000",
        "name": "Beef & Cheese Jalapeño Bagel",
        "description": "Roti bagel topping irisan cabai jalapeño & keju cheddar parut dengan isian smoked beef, sesame mayo & caramelized onion",
        "image": "https://gambar.cimagroup.my.id/product/f5239e58-8fa7-4eac-84d9-3c66b8cd059e.jpg",
        "basePrice": 20000,
        "originalPrice": 20000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 12370,
        "bundleCode": "6493381",
        "productCode": "6493381000",
        "name": "Double Choco Bagel",
        "description": "Roti bagel bercita rasa coklat dengan topping choco chip dan isian choco spread",
        "image": "https://gambar.cimagroup.my.id/product/63681082-b5b6-4943-b58b-96c6b8c64734.jpg",
        "basePrice": 18000,
        "originalPrice": 18000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 11699,
        "bundleCode": "5577304",
        "productCode": "5577304000",
        "name": "Salt Bread Abon",
        "description": "",
        "image": "https://gambar.cimagroup.my.id/product/f19ebfd0-7c6f-437a-bcc0-7f74f6925058.jpg",
        "basePrice": 14000,
        "originalPrice": 14000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 3050,
        "bundleCode": "0413320",
        "productCode": "0413320000",
        "name": "Chocolate Croissant",
        "description": "Croissant pastry yang renyah dengan lapisan butter dan isian cokelat",
        "image": "https://gambar.cimagroup.my.id/product/c1f26135-eacc-4eca-0444-8356c507e0db.jpg",
        "basePrice": 19000,
        "originalPrice": 19000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 9010,
        "bundleCode": "9271252",
        "productCode": "9271252000",
        "name": "Chocolate Donut",
        "description": "Donat dengan taburan meses cokelat",
        "image": "https://gambar.cimagroup.my.id/product/6eb95cd8-4dc2-2f07-c77b-78a5789f1c89.jpg",
        "basePrice": 13000,
        "originalPrice": 13000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 9008,
        "bundleCode": "2743263",
        "productCode": "2743263000",
        "name": "Sugar Donut",
        "description": "Donat dengan taburan gula",
        "image": "https://gambar.cimagroup.my.id/product/8ee8824b-5f64-470c-57aa-d6b81a7ba9f1.jpg",
        "basePrice": 10000,
        "originalPrice": 10000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 12059,
        "bundleCode": "5043322",
        "productCode": "5043322000",
        "name": "Bananachoco Soft Baked Cookie",
        "description": "Soft baked cookie rasa cokelat dengan filling saus pisang",
        "image": "https://gambar.cimagroup.my.id/product/05eb553f-d71c-4fef-aa17-d21c58d62ff1.jpg",
        "basePrice": 18000,
        "originalPrice": 18000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 12058,
        "bundleCode": "9785533",
        "productCode": "9785533000",
        "name": "Sweet Honey Soft Baked Cookie",
        "description": "Soft baked cookie buttery dengan perpaduan rasa madu",
        "image": "https://gambar.cimagroup.my.id/product/690b5282-8bfe-4066-b34e-8091c54e7914.jpg",
        "basePrice": 17000,
        "originalPrice": 17000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 12060,
        "bundleCode": "9536550",
        "productCode": "9536550000",
        "name": "Oatmeal Raisin Soft Baked Cookie",
        "description": "Soft baked cookie oatmeal dengan perpaduan taburan kismis",
        "image": "https://gambar.cimagroup.my.id/product/bf2761e1-0e2f-4e6d-9fd6-3c573c1648c9.jpg",
        "basePrice": 18000,
        "originalPrice": 18000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 11003,
        "bundleCode": "9370104",
        "productCode": "9370104000",
        "name": "Salt Bread Original",
        "description": "Roti bercita rasa gurih dengan sensasi buttery",
        "image": "https://gambar.cimagroup.my.id/product/13fe0b4c-b159-4b60-91ae-b3a6f6552746.jpg",
        "basePrice": 11000,
        "originalPrice": 11000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 10585,
        "bundleCode": "2363098",
        "productCode": "2363098000",
        "name": "Donut Almond",
        "description": "Donut dengan white chocolate dan topping almonds",
        "image": "https://gambar.cimagroup.my.id/product/ee829769-9e58-4125-b31f-7aa1e8dbfad2.jpg",
        "basePrice": 13000,
        "originalPrice": 13000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 11827,
        "bundleCode": "1397942",
        "productCode": "1397942000",
        "name": "Salt Bread Choco Butter",
        "description": "Roti bercita rasa gurih dengan isian butter cokelat",
        "image": "https://gambar.cimagroup.my.id/product/091b6b3e-dd10-45fc-9d49-a905dc713228.jpg",
        "basePrice": 11000,
        "originalPrice": 11000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 3469,
        "bundleCode": "2918119",
        "productCode": "2918119000",
        "name": "Roti Coklat Klasik",
        "description": "Roti bantal lembut dengan isi krim coklat",
        "image": "https://gambar.cimagroup.my.id/product/b10ffd87-6f6e-fb75-8a37-2b1e993bdc8a.jpg",
        "basePrice": 9000,
        "originalPrice": 9000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 3473,
        "bundleCode": "6271571",
        "productCode": "6271571000",
        "name": "Roti Susu Manis",
        "description": "",
        "image": "https://gambar.cimagroup.my.id/product/c84c79bb-893d-c83d-3562-c48b40c66aa8.jpg",
        "basePrice": 10000,
        "originalPrice": 10000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 3466,
        "bundleCode": "8442449",
        "productCode": "8442449000",
        "name": "Roti Keju Manis",
        "description": "",
        "image": "https://gambar.cimagroup.my.id/product/682e9719-e692-1872-c174-d634a34ff67d.jpg",
        "basePrice": 13000,
        "originalPrice": 13000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 4299,
        "bundleCode": "4136526",
        "productCode": "4136526000",
        "name": "Roti Srikaya",
        "description": "Roti bantal lembut isi selai srikaya",
        "image": "https://gambar.cimagroup.my.id/product/a5bbc92a-9abe-d2f3-daf9-b00dca1ac336.jpg",
        "basePrice": 15000,
        "originalPrice": 15000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 5965,
        "bundleCode": "8663835",
        "productCode": "8663835000",
        "name": "Choco Chip Cookies",
        "description": "Cookies renyah dengan taburan choco chip",
        "image": "https://gambar.cimagroup.my.id/product/4974032d-c48d-eac4-93a9-a5d47eaf5f60.jpg",
        "basePrice": 14000,
        "originalPrice": 14000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      },
      {
        "id": 1261,
        "bundleCode": "8273358",
        "productCode": "8273358000",
        "name": "Friend Chip Cookie",
        "description": "Soft cookie cokelat dengan paduan choco chips dan taburan sea salt",
        "image": "https://gambar.cimagroup.my.id/product/bf62a77f-41cf-babb-97e1-4dfc6a889487.jpg",
        "basePrice": 17000,
        "originalPrice": 17000,
        "isSoldOut": false,
        "isCombo": false,
        "category": "Food"
      }
    ]
  }
];

export function getKopiKenanganFallbackMenu(): MenuGroup[] {
  return JSON.parse(JSON.stringify(KOPI_KENANGAN_FALLBACK_MENU));
}

/**
 * Mencari data produk dari katalog fallback berdasarkan bundleCode.
 */
export function findFallbackProductByBundleCode(bundleCode: string): Product | null {
  const norm = (bundleCode || '').trim();
  if (!norm) return null;

  for (const group of KOPI_KENANGAN_FALLBACK_MENU) {
    for (const prod of group.products) {
      if (prod.bundleCode === norm || String(prod.id) === norm) {
        return prod;
      }
    }
  }
  return null;
}

/** Cache in-memory lokal untuk opsi produk lintas outlet (0ms lookup) */
const memoryOptionsCache = new Map<string, ProductOptionDetails>();

/**
 * Mengambil opsi varian produk dari Supabase generic_cache yang pernah disimpan oleh outlet lain.
 * Karena opsi varian Kopi Kenangan (ukuran, suhu, manis, addon) identik secara nasional,
 * opsi dari outlet lain dapat digunakan secara aman saat KK token API sedang tidak tersedia.
 */
export async function findCrossOutletCachedOptions(
  bundleCode: string
): Promise<ProductOptionDetails | null> {
  const normBundle = (bundleCode || '').trim();
  if (!normBundle) return null;

  if (memoryOptionsCache.has(normBundle)) {
    return memoryOptionsCache.get(normBundle)!;
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('generic_cache')
      .select('payload')
      .ilike('key', `options:%:${normBundle}`)
      .limit(1)
      .maybeSingle();

    if (!error && data?.payload?.options) {
      const opt: ProductOptionDetails = data.payload.options;
      memoryOptionsCache.set(normBundle, opt);
      return opt;
    }
  } catch (err: any) {
    console.warn(`[findCrossOutletCachedOptions] Supabase error untuk [${normBundle}]: ${err.message}`);
  }

  // Jika tidak ditemukan di database, cek apakah makanan/non-kustomisasi
  const fallbackProduct = findFallbackProductByBundleCode(normBundle);
  if (fallbackProduct) {
    if (isFoodOrNonCustomizableProduct(fallbackProduct)) {
      const syn = getSynthesizedNonCustomizableOptions(fallbackProduct);
      memoryOptionsCache.set(normBundle, syn);
      return syn;
    }
    // Jika minuman standar Kopi Kenangan, sintesiskan opsi standar resmi
    const synDrink = getSynthesizedKopiKenanganDrinkOptions(fallbackProduct);
    memoryOptionsCache.set(normBundle, synDrink);
    return synDrink;
  }

  return null;
}

/**
 * Menghasilkan opsi varian standar untuk minuman Kopi Kenangan (Suhu, Ukuran, Gula, Es)
 * jika data opsi resmi dari KK API sedang tidak dapat dijangkau dan belum ada di generic_cache.
 */
export function getSynthesizedKopiKenanganDrinkOptions(product: Product): ProductOptionDetails {
  const basePrice = product.basePrice || 18000;
  const desc = product.description || getKkMenuDescription(product.name) || 'Pilihan minuman segar favorit.';
  const bundle = product.bundleCode || String(product.id);

  const dimensions: VariantDimension[] = [
    {
      code: 101,
      name: 'Temperature',
      values: [
        { id: 1001, name: 'Ice' },
        { id: 1002, name: 'Hot' },
      ],
    },
    {
      code: 102,
      name: 'Size',
      values: [
        { id: 2001, name: 'Regular' },
        { id: 2002, name: 'Large' },
      ],
    },
    {
      code: 103,
      name: 'Sugar Level',
      values: [
        { id: 3001, name: 'Normal Sugar' },
        { id: 3002, name: 'Less Sugar' },
        { id: 3003, name: 'No Sugar' },
      ],
    },
    {
      code: 104,
      name: 'Ice Level',
      values: [
        { id: 4001, name: 'Normal Ice' },
        { id: 4002, name: 'Less Ice' },
      ],
    },
  ];

  const skus: VariantSku[] = [
    {
      sku: `${bundle}001`,
      combinationKey: '101-1001:102-2001:103-3001:104-4001:',
      name: product.name,
      description: 'Ice, Regular, Normal Sugar, Normal Ice',
      price: basePrice,
      variantAddition: 0,
    },
    {
      sku: `${bundle}002`,
      combinationKey: '101-1001:102-2002:103-3001:104-4001:',
      name: product.name,
      description: 'Ice, Large, Normal Sugar, Normal Ice',
      price: basePrice + 4000,
      variantAddition: 4000,
    },
  ];

  const optionMap: Record<string, VariantSku> = {
    '101-1001:102-2001:103-3001:104-4001:': skus[0],
    '101-1001:102-2002:103-3001:104-4001:': skus[1],
  };

  const defaultSelectionMap: Record<string, string> = {
    '101': '1001',
    '102': '2001',
    '103': '3001',
    '104': '4001',
  };

  const addons: Addon[] = [
    {
      sku: 'ADD_BOBA',
      name: 'Boba',
      group: 'topping',
      price: 5000,
      isSoldOut: false,
      categoryName: 'Topping',
    },
    {
      sku: 'ADD_CINCAU',
      name: 'Grass Jelly (Cincau)',
      group: 'topping',
      price: 5000,
      isSoldOut: false,
      categoryName: 'Topping',
    },
    {
      sku: 'ADD_COFFEE_JELLY',
      name: 'Coffee Jelly',
      group: 'topping',
      price: 5000,
      isSoldOut: false,
      categoryName: 'Topping',
    },
    {
      sku: 'ADD_ESPRESSO',
      name: 'Extra Shot Espresso',
      group: 'espresso',
      price: 5000,
      isSoldOut: false,
      categoryName: 'Espresso',
    },
  ];

  return {
    product: {
      ...product,
      description: desc,
    },
    dimensions,
    skus,
    optionMap,
    defaultSelectionMap,
    addons,
    notes: [],
  };
}
