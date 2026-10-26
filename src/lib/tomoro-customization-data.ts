/**
 * Konfigurasi Kustomisasi Menu TOMORO Coffee (Hasil Ekstraksi Excel Otoritatif User)
 * File: Kustomisasi_Menu_Tomoro_Coffee_Detail.xlsx
 * Tanggal Pembaruan: 2026-10-26T16:05:09.727Z
 *
 * Logika Pricing:
 * - Menu Dasar: Diskon 50%
 * - Susu (Oat Milk / Coconut Milk): Diskon 50% (Normal +Rp10.000 -> Promo +Rp5.000)
 * - Topping (Sea Salt Cloud / Cheese Cloud): Normal Flat +Rp5.000 (TIDAK KENA DISKON)
 * - Cup: Small
 * - Temp: Iced
 */

export interface TomoroItemCustomizationConfig {
  no: number;
  category: string;
  name: string;
  hargaNormal: number;
  hargaPromo: number;
  adaKustom: boolean;
  canSmall: boolean;
  canIced: boolean;
  sweetness: {
    active: boolean;
    normal: boolean;
    less: boolean;
  };
  milk: {
    active: boolean;
    masterMilk: boolean;
    oatMilk: boolean;
    coconutMilk: boolean;
  };
  topping: {
    active: boolean;
    noTopping: boolean;
    seaSaltCloud: boolean;
    cheeseCloud: boolean;
  };
  addon: {
    active: boolean;
    sugarSyrup: boolean;
  };
  catatan?: string;
}

export const TOMORO_CUSTOMIZATION_CONFIGS: TomoroItemCustomizationConfig[] = [
  {
    "no": 1,
    "category": "MATCHA SERIES",
    "name": "Matcha Latte",
    "hargaNormal": 27000,
    "hargaPromo": 13500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 2,
    "category": "MATCHA SERIES",
    "name": "Matcha Oat Latte",
    "hargaNormal": 28000,
    "hargaPromo": 14000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Oat"
  },
  {
    "no": 3,
    "category": "MATCHA SERIES",
    "name": "Sea Salt Cloud Matcha Latte",
    "hargaNormal": 30000,
    "hargaPromo": 15000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan foam Cloud"
  },
  {
    "no": 4,
    "category": "MATCHA SERIES",
    "name": "Matcha Jasmine Milk Tea",
    "hargaNormal": 23000,
    "hargaPromo": 11500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 5,
    "category": "MATCHA SERIES",
    "name": "Strawberry Matcha Latte",
    "hargaNormal": 30000,
    "hargaPromo": 15000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 6,
    "category": "TOMORO SIGNATURE",
    "name": "TOMORO Aren Latte",
    "hargaNormal": 21000,
    "hargaPromo": 10500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 7,
    "category": "TOMORO SIGNATURE",
    "name": "Sea Salt Cloud Caramel Macchiato",
    "hargaNormal": 30000,
    "hargaPromo": 15000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan foam Cloud"
  },
  {
    "no": 8,
    "category": "TOMORO SIGNATURE",
    "name": "TOMORO Oat Latte",
    "hargaNormal": 24000,
    "hargaPromo": 12000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Oat"
  },
  {
    "no": 9,
    "category": "TOMORO SIGNATURE",
    "name": "Cheese Cloud Chocolate",
    "hargaNormal": 26000,
    "hargaPromo": 13000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan foam Cloud"
  },
  {
    "no": 10,
    "category": "CLASSIC COFFEE",
    "name": "Caffe Latte",
    "hargaNormal": 24000,
    "hargaPromo": 12000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 11,
    "category": "CLASSIC COFFEE",
    "name": "Caffe Americano",
    "hargaNormal": 18000,
    "hargaPromo": 9000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 12,
    "category": "CLASSIC COFFEE",
    "name": "Kopi Susu Aren",
    "hargaNormal": 18000,
    "hargaPromo": 9000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 13,
    "category": "CLASSIC COFFEE",
    "name": "Caffe Mocha",
    "hargaNormal": 25000,
    "hargaPromo": 12500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 14,
    "category": "CLASSIC COFFEE",
    "name": "Cappuccino",
    "hargaNormal": 24000,
    "hargaPromo": 12000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 15,
    "category": "CLASSIC COFFEE",
    "name": "Breve Latte",
    "hargaNormal": 30000,
    "hargaPromo": 15000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 16,
    "category": "FLAVORED LATTE",
    "name": "Caramel Macchiato",
    "hargaNormal": 26000,
    "hargaPromo": 13000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 17,
    "category": "FLAVORED LATTE",
    "name": "Caramel Cheese Latte",
    "hargaNormal": 26000,
    "hargaPromo": 13000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 18,
    "category": "FLAVORED LATTE",
    "name": "Spanish Aren Latte",
    "hargaNormal": 26000,
    "hargaPromo": 13000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 19,
    "category": "FLAVORED LATTE",
    "name": "Coconut Aren Latte",
    "hargaNormal": 25000,
    "hargaPromo": 12500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Kelapa"
  },
  {
    "no": 20,
    "category": "FLAVORED LATTE",
    "name": "Cheese Cloud Latte",
    "hargaNormal": 26000,
    "hargaPromo": 13000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan foam Cloud"
  },
  {
    "no": 21,
    "category": "FLAVORED LATTE",
    "name": "Spanish Latte",
    "hargaNormal": 25000,
    "hargaPromo": 12500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 22,
    "category": "FLAVORED LATTE",
    "name": "TOMORO Coconut Latte",
    "hargaNormal": 23000,
    "hargaPromo": 11500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Kelapa"
  },
  {
    "no": 23,
    "category": "FLAVORED LATTE",
    "name": "Manuka Oat Latte",
    "hargaNormal": 30000,
    "hargaPromo": 15000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Oat"
  },
  {
    "no": 25,
    "category": "CHEESE X NAILOONG SERIES",
    "name": "Dino-mite Mango Frappe",
    "hargaNormal": 26000,
    "hargaPromo": 13000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 26,
    "category": "CHEESE X NAILOONG SERIES",
    "name": "Dino-mite Cloud Tea",
    "hargaNormal": 24000,
    "hargaPromo": 12000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan foam Cloud"
  },
  {
    "no": 27,
    "category": "REFRESHING SERIES",
    "name": "Strawberry Americano",
    "hargaNormal": 19000,
    "hargaPromo": 9500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": false,
      "noTopping": false,
      "seaSaltCloud": false,
      "cheeseCloud": false
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 28,
    "category": "REFRESHING SERIES",
    "name": "Strawberry Jasmine Tea",
    "hargaNormal": 19000,
    "hargaPromo": 9500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": false,
      "noTopping": false,
      "seaSaltCloud": false,
      "cheeseCloud": false
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 29,
    "category": "REFRESHING SERIES",
    "name": "Peach Americano",
    "hargaNormal": 19000,
    "hargaPromo": 9500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 30,
    "category": "REFRESHING SERIES",
    "name": "Peach Jasmine Tea",
    "hargaNormal": 19000,
    "hargaPromo": 9500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 31,
    "category": "REFRESHING SERIES",
    "name": "Lemonade Americano",
    "hargaNormal": 20000,
    "hargaPromo": 10000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 34,
    "category": "REFRESHING SERIES",
    "name": "Grapefruit Americano",
    "hargaNormal": 20000,
    "hargaPromo": 10000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 35,
    "category": "NON COFFEE",
    "name": "Sea Salt Cloud Chocolate",
    "hargaNormal": 28000,
    "hargaPromo": 14000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan foam Cloud"
  },
  {
    "no": 36,
    "category": "NON COFFEE",
    "name": "Hojicha Oat Latte",
    "hargaNormal": 30000,
    "hargaPromo": 15000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Oat"
  },
  {
    "no": 37,
    "category": "NON COFFEE",
    "name": "Chocolate",
    "hargaNormal": 24000,
    "hargaPromo": 12000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  },
  {
    "no": 38,
    "category": "NON COFFEE",
    "name": "Choco Oat Latte",
    "hargaNormal": 28000,
    "hargaPromo": 14000,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": false,
      "normal": false,
      "less": false
    },
    "milk": {
      "active": false,
      "masterMilk": false,
      "oatMilk": false,
      "coconutMilk": false
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": "Varian bawaan susu Oat"
  },
  {
    "no": 39,
    "category": "NON COFFEE",
    "name": "Peach Oolong Milk Tea",
    "hargaNormal": 19000,
    "hargaPromo": 9500,
    "adaKustom": true,
    "canSmall": true,
    "canIced": true,
    "sweetness": {
      "active": true,
      "normal": true,
      "less": true
    },
    "milk": {
      "active": true,
      "masterMilk": true,
      "oatMilk": true,
      "coconutMilk": true
    },
    "topping": {
      "active": true,
      "noTopping": true,
      "seaSaltCloud": true,
      "cheeseCloud": true
    },
    "addon": {
      "active": true,
      "sugarSyrup": true
    },
    "catatan": ""
  }
];

const TOMORO_CONFIG_MAP = new Map<string, TomoroItemCustomizationConfig>();

for (const item of TOMORO_CUSTOMIZATION_CONFIGS) {
  TOMORO_CONFIG_MAP.set(item.name.toLowerCase().trim(), item);
}

export function getTomoroItemConfig(name: string): TomoroItemCustomizationConfig | null {
  if (!name) return null;
  return TOMORO_CONFIG_MAP.get(name.toLowerCase().trim()) || null;
}
