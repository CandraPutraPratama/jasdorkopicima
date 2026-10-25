// File ini di-generate otomatis dari Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx
// Memuat 100% aturan kustomisasi resmi Fore Coffee per menu sesuai konfigurasi admin.

export interface ForeCustomOptionItem {
  name: string;
  price: number;
}

export interface ForeItemConfig {
  nama: string;
  kategori: string;
  hargaNormal: number;
  hasCustomization: boolean;
  canIce: boolean;
  canHot: boolean;
  sizes: {
    regular: boolean;
    large: boolean;
  };
  iceOptions: string[];
  sweetnessOptions: string[];
  espressoOptions: ForeCustomOptionItem[];
  dairyOptions: ForeCustomOptionItem[];
  syrupOptions: ForeCustomOptionItem[];
  toppingOptions: ForeCustomOptionItem[];
  seasonalCup: boolean;
  catatan: string;
}

export const FORE_CUSTOMIZATION_MAP: Record<string, ForeItemConfig> = {
  "americano": {
    "nama": "Americano",
    "kategori": "Americano Series",
    "hargaNormal": 23000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": "Espresso hitam tanpa susu"
  },
  "aren latte": {
    "nama": "Aren Latte",
    "kategori": "Fore Signature",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "berry manuka americano": {
    "nama": "Berry Manuka Americano",
    "kategori": "Americano Series",
    "hargaNormal": 31000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Manuka",
        "price": 7000
      }
    ],
    "toppingOptions": [],
    "seasonalCup": true,
    "catatan": "Espresso hitam tanpa susu"
  },
  "bumi latte": {
    "nama": "Bumi Latte",
    "kategori": "Coffee",
    "hargaNormal": 25000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "buttercream latte": {
    "nama": "Buttercream Latte",
    "kategori": "Fore Signature",
    "hargaNormal": 33000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "buttercream tiramisu latte": {
    "nama": "Buttercream Tiramisu Latte",
    "kategori": "Coffee",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "butterscotch sea salt latte": {
    "nama": "Butterscotch Sea Salt Latte",
    "kategori": "Fore Signature",
    "hargaNormal": 33000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "café latte": {
    "nama": "Café Latte",
    "kategori": "Coffee",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "cappuccino": {
    "nama": "Cappuccino",
    "kategori": "Coffee",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "caramel praline macchiato": {
    "nama": "Caramel Praline Macchiato",
    "kategori": "Coffee",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "crunchy cereal latte": {
    "nama": "Crunchy Cereal Latte",
    "kategori": "Coffee",
    "hargaNormal": 31000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Orange Cream",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "dirty matchapresso": {
    "nama": "Dirty Matchapresso",
    "kategori": "Coffee",
    "hargaNormal": 31000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "double iced shaken latte": {
    "nama": "Double Iced Shaken Latte",
    "kategori": "Coffee",
    "hargaNormal": 33000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "espresso": {
    "nama": "Espresso",
    "kategori": "Coffee",
    "hargaNormal": 21000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": ""
  },
  "kopi dari tani": {
    "nama": "Kopi Dari Tani",
    "kategori": "Fore Signature",
    "hargaNormal": 25000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "malty latte": {
    "nama": "Malty Latte",
    "kategori": "Coffee",
    "hargaNormal": 27000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "manuka americano": {
    "nama": "Manuka Americano",
    "kategori": "Americano Series",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": "Espresso hitam tanpa susu"
  },
  "nutty oat latte": {
    "nama": "Nutty Oat Latte",
    "kategori": "Coffee",
    "hargaNormal": 39000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "pandan latte": {
    "nama": "Pandan Latte",
    "kategori": "Fore Signature",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "salted spanish latte": {
    "nama": "Salted Spanish Latte",
    "kategori": "Coffee",
    "hargaNormal": 27000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Orange Cream",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "starrycano": {
    "nama": "Starrycano",
    "kategori": "Favorit Choice",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [],
    "seasonalCup": true,
    "catatan": ""
  },
  "sunrise mont-black": {
    "nama": "Sunrise Mont-Black",
    "kategori": "Favorit Choice",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Orange Cream",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "triple peach americano": {
    "nama": "Triple Peach Americano",
    "kategori": "Americano Series",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      },
      {
        "name": "+3 Shot",
        "price": 21000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [],
    "seasonalCup": true,
    "catatan": "Espresso hitam tanpa susu"
  },
  "almond choco": {
    "nama": "Almond Choco",
    "kategori": "Non Coffee",
    "hargaNormal": 39000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "No Coffee",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "butterscotch milk crumble": {
    "nama": "Butterscotch Milk Crumble",
    "kategori": "Fore Junior",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "choco caramel cloud": {
    "nama": "Choco Caramel Cloud",
    "kategori": "Fore Junior",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "choco cookie shake": {
    "nama": "Choco Cookie Shake",
    "kategori": "Fore Junior",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "classic milo": {
    "nama": "Classic Milo",
    "kategori": "Non Coffee",
    "hargaNormal": 25000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "coco peach fusion": {
    "nama": "Coco Peach Fusion",
    "kategori": "Refresher",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Orange Cream",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "dark chocolate": {
    "nama": "Dark Chocolate",
    "kategori": "Non Coffee",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "No Coffee",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "matcha butter salt cream": {
    "nama": "Matcha Butter Salt Cream",
    "kategori": "Non Coffee",
    "hargaNormal": 31000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "matcha green tea": {
    "nama": "Matcha Green Tea",
    "kategori": "Non Coffee",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "No Coffee",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "vanilla o' crumbs": {
    "nama": "Vanilla O' Crumbs",
    "kategori": "Fore Junior",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "english breakfast": {
    "nama": "English Breakfast",
    "kategori": "Tea",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "green tea jasmine": {
    "nama": "Green Tea Jasmine",
    "kategori": "Tea",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "green tea mint": {
    "nama": "Green Tea Mint",
    "kategori": "Tea",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "hibiscus lychee peach yakult": {
    "nama": "Hibiscus Lychee Peach Yakult",
    "kategori": "Refresher",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Orange Cream",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "pure chamomile": {
    "nama": "Pure Chamomile",
    "kategori": "Tea",
    "hargaNormal": 29000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": true,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "No Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Fresh Milk",
        "price": 7000
      },
      {
        "name": "UHT Milk",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "sunny citrus jasmine": {
    "nama": "Sunny Citrus Jasmine",
    "kategori": "Refresher",
    "hargaNormal": 31000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice",
      "Ice Separately (Konfirmasi Admin)",
      "No Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Orange Cream",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      },
      {
        "name": "Coffee Cream",
        "price": 7000
      },
      {
        "name": "Tiramisu Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": ""
  },
  "almond croissant": {
    "nama": "Almond Croissant",
    "kategori": "Fore Deli",
    "hargaNormal": 36000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "banana chocolate cake": {
    "nama": "Banana Chocolate Cake",
    "kategori": "Fore Deli",
    "hargaNormal": 27000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "beef mentai sandwich": {
    "nama": "Beef Mentai Sandwich",
    "kategori": "Fore Deli",
    "hargaNormal": 39000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "beef & omelette toast": {
    "nama": "Beef & Omelette Toast",
    "kategori": "Fore Deli",
    "hargaNormal": 36000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "blueberry cheese muffin": {
    "nama": "Blueberry Cheese Muffin",
    "kategori": "Fore Deli",
    "hargaNormal": 36000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "butter croissant": {
    "nama": "Butter Croissant",
    "kategori": "Fore Deli",
    "hargaNormal": 24000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "cheesy tuna sandwich": {
    "nama": "Cheesy Tuna Sandwich",
    "kategori": "Fore Deli",
    "hargaNormal": 39000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "chicken teriyaki sandwich": {
    "nama": "Chicken Teriyaki Sandwich",
    "kategori": "Fore Deli",
    "hargaNormal": 39000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "choco melt muffin": {
    "nama": "Choco Melt Muffin",
    "kategori": "Fore Deli",
    "hargaNormal": 36000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "kouign-amann": {
    "nama": "Kouign-Amann",
    "kategori": "Fore Deli",
    "hargaNormal": 29000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "mushroom truffle sandwich": {
    "nama": "Mushroom Truffle Sandwich",
    "kategori": "Fore Deli",
    "hargaNormal": 42000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "pain au chocolat": {
    "nama": "Pain au Chocolat",
    "kategori": "Fore Deli",
    "hargaNormal": 29000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "roll cake cheese pandan": {
    "nama": "Roll Cake Cheese Pandan",
    "kategori": "Fore Deli",
    "hargaNormal": 27000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "roll cake mocha": {
    "nama": "Roll Cake Mocha",
    "kategori": "Fore Deli",
    "hargaNormal": 27000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "roll cake peanut butter & jam": {
    "nama": "Roll Cake Peanut Butter & Jam",
    "kategori": "Fore Deli",
    "hargaNormal": 27000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "smoked beef & cheese sandwich": {
    "nama": "Smoked Beef & Cheese Sandwich",
    "kategori": "Fore Deli",
    "hargaNormal": 39000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "triple cheese danish": {
    "nama": "Triple Cheese Danish",
    "kategori": "Fore Deli",
    "hargaNormal": 36000,
    "hasCustomization": false,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Pastry / Makanan (bisa dipanaskan/toast)"
  },
  "caramel praline coffee ice blended": {
    "nama": "Caramel Praline Coffee Ice Blended",
    "kategori": "Ice Blended",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      },
      {
        "name": "Sea Salt Cream",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": "Hanya tersedia dingin (blended)"
  },
  "chocolate ice blended": {
    "nama": "Chocolate Ice Blended",
    "kategori": "Ice Blended",
    "hargaNormal": 37000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "No Coffee",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      }
    ],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Pecan Praline",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": "Hanya tersedia dingin (blended)"
  },
  "matcha ice blended": {
    "nama": "Matcha Ice Blended",
    "kategori": "Ice Blended",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      },
      {
        "name": "Salted Caramel",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": "Hanya tersedia dingin (blended)"
  },
  "strawberry ice blended": {
    "nama": "Strawberry Ice Blended",
    "kategori": "Ice Blended",
    "hargaNormal": 34000,
    "hasCustomization": true,
    "canIce": true,
    "canHot": false,
    "sizes": {
      "regular": true,
      "large": true
    },
    "iceOptions": [
      "Normal Ice",
      "Less Ice",
      "More Ice"
    ],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [
      {
        "name": "Milk",
        "price": 0
      },
      {
        "name": "Soy Multigrain",
        "price": 7000
      },
      {
        "name": "Oat Milk",
        "price": 15000
      },
      {
        "name": "Almond Milk",
        "price": 15000
      }
    ],
    "syrupOptions": [
      {
        "name": "Aren",
        "price": 7000
      },
      {
        "name": "Hazelnut",
        "price": 7000
      },
      {
        "name": "Pandan",
        "price": 7000
      },
      {
        "name": "Manuka",
        "price": 7000
      },
      {
        "name": "Vanilla",
        "price": 7000
      }
    ],
    "toppingOptions": [
      {
        "name": "Caramel Sauce",
        "price": 7000
      },
      {
        "name": "Crumble",
        "price": 7000
      },
      {
        "name": "Milo Powder",
        "price": 7000
      },
      {
        "name": "Oreo Crumbs",
        "price": 7000
      }
    ],
    "seasonalCup": true,
    "catatan": "Hanya tersedia dingin (blended)"
  },
  "almond choco 1l": {
    "nama": "Almond Choco 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 124000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "aren latte 1l": {
    "nama": "Aren Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 90000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "bumi latte 1l": {
    "nama": "Bumi Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 84000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "butterscotch sea salt latte 1l": {
    "nama": "Butterscotch Sea Salt Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 129000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "café latte 1l": {
    "nama": "Café Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 90000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "caramel praline macchiato 1l": {
    "nama": "Caramel Praline Macchiato 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 99000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "coco peach fusion 1l": {
    "nama": "Coco Peach Fusion 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 90000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "crunchy cereal latte 1l": {
    "nama": "Crunchy Cereal Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 99000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "dark chocolate 1l": {
    "nama": "Dark Chocolate 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 99000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "No Coffee",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "kopi dari tani 1l": {
    "nama": "Kopi Dari Tani 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 84000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "matcha green tea 1l": {
    "nama": "Matcha Green Tea 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 99000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "No Coffee",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "nutty oat latte 1l": {
    "nama": "Nutty Oat Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 124000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "pandan latte 1l": {
    "nama": "Pandan Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 90000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  },
  "salted spanish latte 1l": {
    "nama": "Salted Spanish Latte 1L",
    "kategori": "FOREveryone 1L",
    "hargaNormal": 90000,
    "hasCustomization": true,
    "canIce": false,
    "canHot": false,
    "sizes": {
      "regular": false,
      "large": false
    },
    "iceOptions": [],
    "sweetnessOptions": [
      "Normal Sweet",
      "Less Sweet"
    ],
    "espressoOptions": [
      {
        "name": "Normal Shot",
        "price": 0
      },
      {
        "name": "+1 Shot",
        "price": 7000
      },
      {
        "name": "+2 Shot",
        "price": 14000
      }
    ],
    "dairyOptions": [],
    "syrupOptions": [],
    "toppingOptions": [],
    "seasonalCup": false,
    "catatan": "Kemasan botol 1 liter siap saji"
  }
};

/**
 * Normalisasi nama produk untuk pencarian kustomisasi Fore.
 */
export function normalizeForeMenuKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mengambil konfigurasi kustomisasi untuk nama produk Fore tertentu.
 */
export function getForeItemConfig(productName: string): ForeItemConfig | null {
  const key = normalizeForeMenuKey(productName);
  return FORE_CUSTOMIZATION_MAP[key] || null;
}
