
window.formatRupiah = function(val) {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
};

function storefrontApp() {
    return {
        formatRupiah(val) {
            return window.formatRupiah(val);
        },
        // Data dari Controller / Service OOP
        brands: [{"id":"kopken","name":"Kopi Kenangan","slug":"kopi-kenangan","tagline":"Memories in Every Drop","color":"#FF1493","logo":"https:\/\/jasdorforyou.my.id\/storage\/brands\/hfIMByGw6UDDBnoacx0TAOrMtvuiKgFkiklwuXkO.png","admin_fee":4500,"categories":["Semua Menu","Coffee","Non Coffee"]},{"id":"fore","name":"Fore Coffee","slug":"tomoro-coffee","tagline":"Grind The Essentials","color":"#FF1493","logo":"https:\/\/jasdorforyou.my.id\/storage\/brands\/GldRq6TwPGdhlIsIeNquFM4kEDTvW7NRZzaBcF0G.webp","admin_fee":3000,"categories":["Semua Menu","Ice Blended","Fore Signature","Coffee","Americano Series","Non Coffee","FOREveryone 1L","Refresher","Tea","Fore Junior"]},{"id":"tomoro","name":"Tomoro Coffe","slug":"tomoro-coffee","tagline":"Hey! Enjoy Your Coffee Time","color":"#FF1493","logo":"https:\/\/jasdorforyou.my.id\/storage\/brands\/DKEXHEjHpWBnSTXjALkvJiTpnuro1q9uq3bQWHJ5.png","admin_fee":5500,"categories":["Semua Menu","Coffee","Refreshing Series","Non Coffee","Frappe","Cheese x Nailong Series"]},{"id":"janjijiwa","name":"Janji Jiwa","slug":"janji-jiwa","tagline":"Kopi dari Hati Teman Sejiwa","color":"#FF1493","logo":"https:\/\/jasdorforyou.my.id\/storage\/brands\/3NfABjOjT4Uqr4aVAzWU2m6o5q9LpgOQ1lMjjnLR.webp","admin_fee":4500,"categories":["Semua Menu","Ube Series","Coffee","Sahabat Series","Tea Series","Non-Coffee","Jiwa Toast"]}],
        products: [{"id":"1","brand_id":"tomoro","name":"Caffe Latte","category":"Coffee","description":"","price":18000,"original_price":24000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/MlxE1DbegVzDRGUDfFBOszHDa9FsueBa3ZkSonvG.jpg","options":[]},{"id":"2","brand_id":"tomoro","name":"Caffe Americano","category":"Coffee","description":"","price":13000,"original_price":18000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/5Khr52zY2nqNh3iAcpUyC7fEB8BCFHNWucOtRJPJ.jpg","options":[]},{"id":"3","brand_id":"tomoro","name":"Kopi Susu Aren","category":"Coffee","description":"","price":14000,"original_price":18000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/c700WokPkkLcp5q124FuoLPOJk7du1IIy06xL7p3.jpg","options":[]},{"id":"4","brand_id":"tomoro","name":"Caffe Mocha","category":"Coffee","description":"","price":19000,"original_price":25000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/LR62FOUiQEmybEenxMdzI2LVBbarLtwlROfpkvMJ.jpg","options":[]},{"id":"5","brand_id":"tomoro","name":"Cappuccino","category":"Coffee","description":"","price":18000,"original_price":24000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/FCk7m0dqRzFPeWiDQKF65Q9uxZ5KhAeTVa4yxA0k.jpg","options":[]},{"id":"6","brand_id":"tomoro","name":"Breve Latte","category":"Coffee","description":"","price":21500,"original_price":30000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/a3IRWc4tfIBAKw1imhR9Af4CVX1O1hSzTw22w0MQ.jpg","options":[]},{"id":"7","brand_id":"tomoro","name":"Caramel Macchiato","category":"Coffee","description":"","price":19000,"original_price":26000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/W72QTLXDU3dBbjmxPAwXOU2ou1pkQ9ccIZmIIz5Z.jpg","options":[]},{"id":"8","brand_id":"tomoro","name":"Caramel Cheese Latte","category":"Coffee","description":"","price":19000,"original_price":26000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/fHeLSUiHu9hqDFinyKKPtIynUSmBEXsn3D9s1sDl.jpg","options":[]},{"id":"9","brand_id":"tomoro","name":"Spanish Aren Latte","category":"Coffee","description":"","price":19000,"original_price":26000,"image":"","options":[]},{"id":"10","brand_id":"tomoro","name":"Coconut Aren Latte","category":"Coffee","description":"","price":17000,"original_price":25000,"image":"","options":[]},{"id":"11","brand_id":"tomoro","name":"Cheese Cloud Latte","category":"Coffee","description":"","price":19000,"original_price":26000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/h8NWYuSbR2JfSsWNAY17Mdcwnaw1fST8aOaT5kMP.jpg","options":[]},{"id":"12","brand_id":"tomoro","name":"Spanish Latte","category":"Coffee","description":"","price":19000,"original_price":25000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/h5110Q01JBtKzKSHwCp2ZcixuXZs7JOM01Fw20Nw.jpg","options":[]},{"id":"13","brand_id":"tomoro","name":"Strawberry Americano","category":"Refreshing Series","description":"","price":14000,"original_price":19000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/5rdEcWdHhpStDpuFVh1Q44ROJo5BPLnwKrxfw883.jpg","options":[]},{"id":"14","brand_id":"tomoro","name":"Strawberry Jasmine Tea","category":"Refreshing Series","description":"","price":14000,"original_price":19000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/o1wvWeT9sYGZnmyC4lDt1RSq4pgzuQnoeXzcUvEk.jpg","options":[]},{"id":"15","brand_id":"tomoro","name":"Peach Americano","category":"Refreshing Series","description":"","price":14000,"original_price":19000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/XziEeO5FneN2wbVQFslXNEdtM58CgobNqdQPnnOo.jpg","options":[]},{"id":"16","brand_id":"tomoro","name":"Peach Jasmine Tea","category":"Refreshing Series","description":"","price":14000,"original_price":19000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/IafhQaIBNREOrLK0HJDReZ2nB8wen6rUTQGLT3pw.jpg","options":[]},{"id":"17","brand_id":"tomoro","name":"Sea Salt Cloud Chocolate","category":"Non Coffee","description":"","price":21000,"original_price":28000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/xei6oqQBFgRcPxv5kqIooMOl0C2ZUmwYBj4ksVxz.jpg","options":[]},{"id":"18","brand_id":"tomoro","name":"Matcha Latte","category":"Non Coffee","description":"Isi catatan dibawah:\n- level sugar:\n- level ice","price":19000,"original_price":27000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/8e6il8zCBLkInzbhYm0BHchabswm1VzXcobN9Zol.jpg","options":[]},{"id":"19","brand_id":"tomoro","name":"Matcha Oat Latte","category":"Non Coffee","description":"","price":21000,"original_price":28000,"image":"","options":[]},{"id":"20","brand_id":"tomoro","name":"Sea Salt Cloud Matcha Latte","category":"Non Coffee","description":"","price":22000,"original_price":30000,"image":"","options":[]},{"id":"21","brand_id":"tomoro","name":"Matcha Frappe","category":"Frappe","description":"","price":21000,"original_price":27000,"image":"","options":[]},{"id":"22","brand_id":"tomoro","name":"Strawberry Matcha Latte","category":"Non Coffee","description":"","price":20000,"original_price":30000,"image":"","options":[]},{"id":"23","brand_id":"tomoro","name":"Matcha Jasmine Tea","category":"Non Coffee","description":"","price":17000,"original_price":23000,"image":"","options":[]},{"id":"24","brand_id":"tomoro","name":"TOMORO Oat Latte","category":"Coffee","description":"","price":18000,"original_price":24000,"image":"","options":[]},{"id":"25","brand_id":"tomoro","name":"Sea Salt Cloud Caramel Macchiato","category":"Coffee","description":"","price":23000,"original_price":30000,"image":"","options":[]},{"id":"26","brand_id":"tomoro","name":"Cheese Cloud Chocolate","category":"Coffee","description":"","price":20000,"original_price":26000,"image":"","options":[]},{"id":"27","brand_id":"tomoro","name":"Manuka Oat Latte","category":"Coffee","description":"","price":21000,"original_price":30000,"image":"","options":[]},{"id":"28","brand_id":"tomoro","name":"Lemonade Americano","category":"Refreshing Series","description":"","price":15000,"original_price":20000,"image":"","options":[]},{"id":"29","brand_id":"tomoro","name":"Pink Pop Lemonade","category":"Refreshing Series","description":"","price":10000,"original_price":14000,"image":"","options":[]},{"id":"30","brand_id":"tomoro","name":"Pink Pop Lemon Tea","category":"Refreshing Series","description":"","price":12500,"original_price":17000,"image":"","options":[]},{"id":"31","brand_id":"tomoro","name":"Grapefruit Americano","category":"Refreshing Series","description":"","price":16000,"original_price":20000,"image":"","options":[]},{"id":"32","brand_id":"tomoro","name":"Hojicha Oat Latte","category":"Non Coffee","description":"","price":22000,"original_price":30000,"image":"","options":[]},{"id":"33","brand_id":"tomoro","name":"Chocolate","category":"Non Coffee","description":"","price":17000,"original_price":24000,"image":"","options":[]},{"id":"34","brand_id":"tomoro","name":"Choco Oat Latte","category":"Non Coffee","description":"","price":21000,"original_price":28000,"image":"","options":[]},{"id":"35","brand_id":"tomoro","name":"Peach Oolong Milk Tea","category":"Non Coffee","description":"","price":15500,"original_price":19000,"image":"","options":[]},{"id":"36","brand_id":"tomoro","name":"Peach Coconut Frappe","category":"Frappe","description":"","price":15000,"original_price":19000,"image":"","options":[]},{"id":"37","brand_id":"tomoro","name":"Strawberry Jasmine Smoothie","category":"Frappe","description":"","price":15000,"original_price":19000,"image":"","options":[]},{"id":"38","brand_id":"tomoro","name":"Chocolate Frappe","category":"Frappe","description":"","price":19000,"original_price":24000,"image":"","options":[]},{"id":"39","brand_id":"tomoro","name":"Dino-mite Mango Frappe","category":"Cheese x Nailong Series","description":"","price":19000,"original_price":26000,"image":"","options":[]},{"id":"40","brand_id":"tomoro","name":"Dino-mite Cloud Tea","category":"Cheese x Nailong Series","description":"","price":19000,"original_price":24000,"image":"","options":[]},{"id":"41","brand_id":"fore","name":"Caramel Praline Coffee Ice Blended","category":"Ice Blended","description":"","price":30000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/n03jxfqIf8Q4wxQla42wVCPT3wFEYbxGiLm9AUkN.jpg","options":[]},{"id":"42","brand_id":"fore","name":"Kopi Dari Tani","category":"Fore Signature","description":"","price":21500,"original_price":25000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/Y9eddE0fNpt6kbb9jyrgZmtEJOHGgY37cehXheHb.jpg","options":[]},{"id":"43","brand_id":"fore","name":"Dirty Matchapresso","category":"Coffee","description":"","price":27000,"original_price":31000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/NI6WKagiIsYomk8GsFXeJmUr5yuQCBIRC5aDeTud.jpg","options":[]},{"id":"44","brand_id":"fore","name":"Americano","category":"Americano Series","description":"","price":20000,"original_price":23000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/Xb6IdflVD3ywxLhjVzsS5PPvqlwigBllzaCffUBn.jpg","options":[]},{"id":"45","brand_id":"fore","name":"Matcha Butter Salt Cream","category":"Non Coffee","description":"","price":27000,"original_price":31000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/pYkFHE8OAg5X2gAwNYIIqZfLrCc4TLxRj8ngXd5w.jpg","options":[]},{"id":"47","brand_id":"fore","name":"Coco Peach Fusion","category":"FOREveryone 1L","description":"","price":78000,"original_price":89000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/E7i6CoKG7pWmW9YXUe8MYD90r91ABqj9kYksySp0.jpg","options":[]},{"id":"48","brand_id":"fore","name":"Hibiscus Lychee Peach Yakult","category":"Refresher","description":"","price":24000,"original_price":29000,"image":"","options":[]},{"id":"49","brand_id":"fore","name":"English Breakfast","category":"Tea","description":"","price":26000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/4ziU5HQmsPAKsTEzzBe8XEZsYglL04ErSYQtlqrk.jpg","options":[]},{"id":"50","brand_id":"janjijiwa","name":"Ube Matcha","category":"Ube Series","description":"","price":18000,"original_price":27000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/Uywp2xyaF2zPxi7OAUyyMJHiZoVDJK1AaqQu0BMN.jpg","options":[]},{"id":"51","brand_id":"janjijiwa","name":"Americano","category":"Coffee","description":"","price":14000,"original_price":24000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/GdGUA2Ds0AxvcYpDs9Z83zZA9HKOBM9oMVmSL0Bh.jpg","options":[]},{"id":"52","brand_id":"janjijiwa","name":"Signature Kopi Susu","category":"Coffee","description":"","price":16000,"original_price":28000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/OAHFQVTa0nkQrymix06tb7KA10KmbIP99crjDXj7.jpg","options":[]},{"id":"53","brand_id":"janjijiwa","name":"Caramel Macchiato","category":"Coffee","description":"","price":21000,"original_price":30000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/B0MYDlflwb8GcSilLBpaIKbbbx3REsSPBGorS1Wy.jpg","options":[]},{"id":"54","brand_id":"janjijiwa","name":"Latte X","category":"Coffee","description":"","price":17000,"original_price":24000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/xsYGTiYj0O8kxguPCleGkFHqilOKc4nBU5sWBAjQ.jpg","options":[]},{"id":"55","brand_id":"janjijiwa","name":"Ice Double Shaken Espresso","category":"Coffee","description":"","price":20000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/cbw6Jbmof6uaFSk3UOd9hK6MYQjy0tAf33BLsu4G.jpg","options":[]},{"id":"56","brand_id":"janjijiwa","name":"Vanilla Latte","category":"Coffee","description":"","price":20000,"original_price":32000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/bWo8F9mJHluNCdgwkOMWnNRg6KU6BdumeAwaONBA.jpg","options":[]},{"id":"57","brand_id":"fore","name":"Matcha Ice Blended","category":"Ice Blended","description":"","price":30000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/bMRaWbKfS30uzA8LTm5JDLWyNM3RnlEQrnTyDY0U.jpg","options":[]},{"id":"58","brand_id":"fore","name":"Strawberry Ice Blended","category":"Ice Blended","description":"","price":30000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/dOIm1uedJn7wzxV9qhU00NPHh3so3Zy7P9e6irBa.jpg","options":[]},{"id":"59","brand_id":"fore","name":"Chocolate Ice Blended","category":"Ice Blended","description":"","price":32000,"original_price":37000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/eEXJHrNrbIthd0gWUXrT7wbdODNzhAYweVivI2vy.jpg","options":[]},{"id":"60","brand_id":"fore","name":"Butterscoth Sea Salt Latte","category":"Fore Signature","description":"","price":29000,"original_price":33000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/XzgCA9zy10lnYmfr0qcit40emvDEY2EoBTpY10S8.jpg","options":[]},{"id":"61","brand_id":"fore","name":"Buttercream Latte","category":"Fore Signature","description":"","price":29000,"original_price":33000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/GCiZ57AqtXW4IV2y2gHyGsooyWDTFBwiip7bjrXU.jpg","options":[]},{"id":"62","brand_id":"fore","name":"Aren Latte ","category":"Fore Signature","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/DsbnwQvj9X8Q4ite02V9xwZiBYlu8PGBA53VHxut.jpg","options":[]},{"id":"63","brand_id":"fore","name":"Pandan Latte","category":"Fore Signature","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/F2dFqtZ4NiNTlyNAdSoK7d68Ulim7PuAK9jVBEpC.jpg","options":[]},{"id":"64","brand_id":"fore","name":"Malty Latte","category":"Coffee","description":"","price":23000,"original_price":27000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/jIJIH8aV1LlAnRK1jeFJ7WSSOtCAUTn4VwwaEKxC.jpg","options":[]},{"id":"65","brand_id":"fore","name":"Bumi Latte","category":"Coffee","description":"","price":22000,"original_price":25000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/muGcyKSvInNW5SdsQgfCJpUVyNB5p7i0CeZgs93V.jpg","options":[]},{"id":"66","brand_id":"fore","name":"Cappucino ","category":"Coffee","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/71dl4yo39KMYgPtVyt6XMx6j0HCMmuJNbPkJyFId.jpg","options":[]},{"id":"67","brand_id":"fore","name":"Double Ice Shaken Latte","category":"Coffee","description":"","price":29500,"original_price":33000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/TjRDNhTZLvb9FBQHnaMOo6os66Zww75lTd1V1Lkg.jpg","options":[]},{"id":"68","brand_id":"fore","name":"Cafe Latte","category":"Coffee","description":"","price":25500,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/WahOsszM9pNsBv3MQJQwmSuBr6qL29mcaIBtiw8c.jpg","options":[]},{"id":"69","brand_id":"fore","name":"Nuty Oat Latte","category":"Coffee","description":"","price":34500,"original_price":39000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/AkNUuCp3w38qG2oV9bTrzhrRTuqyvITHOguYQBt3.jpg","options":[]},{"id":"70","brand_id":"fore","name":"Buttercream Tiramisu Latte","category":"Coffee","description":"","price":30000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/aRPFuSKjGofwjCkItpUgVxgmQcwlTXj8JjaLpSwn.jpg","options":[]},{"id":"71","brand_id":"fore","name":"Espresso","category":"Coffee","description":"","price":18000,"original_price":21000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/U8c21jV22RTgOMoKd6jKG8oLtPDgcCghD4WIO0Z1.jpg","options":[]},{"id":"72","brand_id":"fore","name":"Caramel Praline Macchiato","category":"Coffee","description":"","price":30000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/EQBbqSYCct3vwKZYkVStPyPhW1xdq8xF4DvL6fpo.jpg","options":[]},{"id":"73","brand_id":"fore","name":"Manuka Americano","category":"Coffee","description":"","price":24000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/wavLOkqUwixc136E6vmy7bsoDhZisKWbdmtDczIz.jpg","options":[]},{"id":"74","brand_id":"fore","name":"Triple Peach Americano","category":"Americano Series","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/DKYzv9H4BkRl5oR9OWwxTdcSKO6noUcARhZflQxS.jpg","options":[]},{"id":"75","brand_id":"fore","name":"Berry Manuka Americano ","category":"Americano Series","description":"","price":26500,"original_price":31000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/9L8jbqpYsb0s9wcM7uFzgZfm9YB84tdkomALTst4.jpg","options":[]},{"id":"76","brand_id":"fore","name":"Dark Chocolate","category":"Non Coffee","description":"","price":29000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/ovscLXbABTvI6zty8HsylrFH3PGlVUlmKdG4hQmO.jpg","options":[]},{"id":"77","brand_id":"fore","name":"Almond Choco","category":"Non Coffee","description":"","price":34500,"original_price":39000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/WHF8UCi5ntwRqqqlRwAqruE550DRsiSow70okOGI.jpg","options":[]},{"id":"78","brand_id":"fore","name":"Matcha Green Tea","category":"Non Coffee","description":"","price":29000,"original_price":34000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/yZ5gFA6MryyoR7H82lrOUea9EVF99pOpO3jZVFSp.jpg","options":[]},{"id":"79","brand_id":"fore","name":"Classic Milo","category":"Non Coffee","description":"","price":22000,"original_price":22000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/0y9OMu1MfGX4tqjDFD2oJBNhuITNyAmY42m8n0Fp.jpg","options":[]},{"id":"80","brand_id":"fore","name":"Choco Cookie Shake","category":"Fore Junior","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/8YUNb4SBi8d7oRPSReTkcSMMxsIKDeyzvkcGCw0w.jpg","options":[]},{"id":"81","brand_id":"fore","name":"Butterscoth Milk Crumble","category":"Fore Junior","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/oBIZxzZFLlccBLSsOYsqixNDZn7TI5gpyChjoagt.jpg","options":[]},{"id":"82","brand_id":"fore","name":"Vanilla O\u0027Crumbs","category":"Fore Junior","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/O3FOUHzD1w0EBjS7tX4GHIlJZmljgOOqZS3KvN4V.jpg","options":[]},{"id":"83","brand_id":"fore","name":"Choco Caramel Cloud","category":"Fore Junior","description":"","price":25000,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/8KINkXPKKlaRJdWQ39aptMqwmFun67RZNvEjeuoA.jpg","options":[]},{"id":"84","brand_id":"fore","name":"Crunchy Cereal Latte","category":"FOREveryone 1L","description":"","price":92000,"original_price":109000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/SHcesTtHEgsjvLu1ZZsTzzEFUZRufEELaRf0TZ11.jpg","options":[]},{"id":"85","brand_id":"fore","name":"Salted Spanish Latte","category":"Coffee","description":"","price":77000,"original_price":90000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/KsuX80qado1sve2Z3NmJKQGbqVegiLfi4KgxksTt.jpg","options":[]},{"id":"86","brand_id":"fore","name":"Kopi Dari Tani","category":"FOREveryone 1L","description":"","price":75500,"original_price":89000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/9Q4RyuybVVIsuzizIvk3IHcczppT4ejKWHq2Eh3v.jpg","options":[]},{"id":"87","brand_id":"fore","name":"Bumi Latte","category":"FOREveryone 1L","description":"","price":75500,"original_price":89000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/ZbCPmjQCqI5EdWeEaUoQC1eMPpWKkAvd8hsaoN1L.jpg","options":[]},{"id":"88","brand_id":"fore","name":"Dark Chocolate","category":"FOREveryone 1L","description":"","price":92000,"original_price":109000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/F9ePVnB7lKo6QJftsF3XfiZX3JO7T0UC3tJXaRUZ.jpg","options":[]},{"id":"89","brand_id":"janjijiwa","name":"Ube Coconut Cloud","category":"Ube Series","description":"","price":18500,"original_price":27000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/FIvBNQGwP1VBHSIRa5Ks3IeBjI9RYOykGNuJLfDP.jpg","options":[]},{"id":"90","brand_id":"janjijiwa","name":"Mocha","category":"Coffee","description":"","price":20500,"original_price":30000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/7DoSK0bDyJIH8AniHpxUNweBJX9nGNgNVrs045Bq.jpg","options":[]},{"id":"91","brand_id":"janjijiwa","name":"Milo Mocha Macchiato","category":"Coffee","description":"","price":21000,"original_price":30000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/gmugHpbfnw8CXypLUualJiPUJjDLbb6xXacKvQsw.jpg","options":[]},{"id":"92","brand_id":"janjijiwa","name":"Hazelnut Latte","category":"Coffee","description":"","price":20000,"original_price":280000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/WAzjvDlITiMOnO7relPwA2oTLH3Kg1Zyf0JDlaKO.jpg","options":[]},{"id":"93","brand_id":"janjijiwa","name":"Caramel Latte","category":"Coffee","description":"","price":20000,"original_price":28000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/jZalDQWtsayFppjAVsqSe40ja2gWtrbJnDlqQaUS.jpg","options":[]},{"id":"94","brand_id":"janjijiwa","name":"Sahabat Latte","category":"Sahabat Series","description":"","price":12000,"original_price":17000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/rX1BZlfa2aBATgGRcGGo3Q7vD8AQ48GPfEtIIis9.jpg","options":[]},{"id":"95","brand_id":"janjijiwa","name":"Sahabat Vanilla Latte","category":"Sahabat Series","description":"","price":13000,"original_price":18000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/inE5lCD1MDdJXsMUHebIfMkg8gvnH6yNIvCmNiuy.jpg","options":[]},{"id":"96","brand_id":"janjijiwa","name":"Sahabat Caramel Latte","category":"Sahabat Series","description":"","price":13000,"original_price":18000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/CNz1u7xoCndJd0eflpvBk7PxfOCo3Zx8nT7LLpAk.jpg","options":[]},{"id":"97","brand_id":"janjijiwa","name":"Sahabat Hazelnut Latte","category":"Sahabat Series","description":"","price":13000,"original_price":18000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/d4z0evJtbCrOkpMaOcfvipx8LgtohWy6LzyzS7ge.jpg","options":[]},{"id":"98","brand_id":"janjijiwa","name":"Mango Americano","category":"Coffee","description":"","price":19000,"original_price":28000,"image":"","options":[]},{"id":"99","brand_id":"janjijiwa","name":"Mont Black","category":"Coffee","description":"","price":18000,"original_price":28000,"image":"","options":[]},{"id":"100","brand_id":"janjijiwa","name":"Pear Shaken Americano","category":"Coffee","description":"","price":18500,"original_price":29000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/OtV5i8QPAvQ65bXrh20t3QzuuRWYl6Rbh2SDGmZK.jpg","options":[]},{"id":"101","brand_id":"janjijiwa","name":"Black Forest Americano","category":"Coffee","description":"","price":18500,"original_price":28000,"image":"","options":[]},{"id":"102","brand_id":"janjijiwa","name":"Hibiscus Mix Berry","category":"Tea Series","description":"","price":16000,"original_price":22000,"image":"","options":[]},{"id":"103","brand_id":"janjijiwa","name":"Jasmine Fresh Mint","category":"Tea Series","description":"","price":16000,"original_price":22000,"image":"","options":[]},{"id":"104","brand_id":"janjijiwa","name":"Early Grey Tea","category":"Tea Series","description":"","price":14000,"original_price":20000,"image":"","options":[]},{"id":"105","brand_id":"janjijiwa","name":"Fruity Peach Tea","category":"Tea Series","description":"","price":17000,"original_price":26000,"image":"","options":[]},{"id":"106","brand_id":"janjijiwa","name":"Fruity Lychee Tea","category":"Tea Series","description":"","price":17000,"original_price":26000,"image":"","options":[]},{"id":"107","brand_id":"janjijiwa","name":"Thai Milk Tea","category":"Tea Series","description":"","price":18000,"original_price":28000,"image":"","options":[]},{"id":"108","brand_id":"janjijiwa","name":"Lychee Tea With Coco Jelly","category":"Tea Series","description":"","price":17000,"original_price":26000,"image":"","options":[]},{"id":"109","brand_id":"janjijiwa","name":"Peach Tea With Coco Jelly","category":"Tea Series","description":"","price":17000,"original_price":26000,"image":"","options":[]},{"id":"110","brand_id":"janjijiwa","name":"Lemon Tea With Coco Jelly","category":"Tea Series","description":"","price":17000,"original_price":26000,"image":"","options":[]},{"id":"111","brand_id":"janjijiwa","name":"Early Grey Milk Tea","category":"Tea Series","description":"","price":18500,"original_price":28000,"image":"","options":[]},{"id":"112","brand_id":"janjijiwa","name":"Matcha Latte","category":"Non-Coffee","description":"","price":21000,"original_price":33000,"image":"","options":[]},{"id":"113","brand_id":"janjijiwa","name":"Classic Chocolate","category":"Non-Coffee","description":"","price":18000,"original_price":25000,"image":"","options":[]},{"id":"114","brand_id":"janjijiwa","name":"Hazelnut Choco","category":"Non-Coffee","description":"","price":19500,"original_price":28000,"image":"","options":[]},{"id":"115","brand_id":"janjijiwa","name":"Royale Milo","category":"Non-Coffee","description":"","price":20000,"original_price":30000,"image":"","options":[]},{"id":"116","brand_id":"janjijiwa","name":"Milo Macchiato","category":"Non-Coffee","description":"","price":20000,"original_price":30000,"image":"","options":[]},{"id":"117","brand_id":"janjijiwa","name":"Egg n Cheese","category":"Jiwa Toast","description":"","price":20000,"original_price":30000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/1ck2WYfETNyGPx6s9qRm10ZkJwrbuLeNJX5EvKZW.jpg","options":[]},{"id":"118","brand_id":"janjijiwa","name":"Creamy Egg Truffle","category":"Jiwa Toast","description":"","price":23000,"original_price":36000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/B7QrECSJtTrAfnJzZGSb4flBUV17PXSFh91laBpH.jpg","options":[]},{"id":"119","brand_id":"janjijiwa","name":"Crispy Chicken Mentai","category":"Jiwa Toast","description":"","price":23000,"original_price":36000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/ZAVLSo9HENnXSA28ZpV8DUBVjLiDFig0tsbYncCe.jpg","options":[]},{"id":"120","brand_id":"janjijiwa","name":"Cheezy Crispy Chicken Mentai","category":"Jiwa Toast","description":"","price":23000,"original_price":36000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/l3KOeeyfSNSXAWwCyFaI2uLJB8QkPkHNA7Hq2Ic4.jpg","options":[]},{"id":"121","brand_id":"janjijiwa","name":"Ultimate Cheesy Beef","category":"Jiwa Toast","description":"","price":23500,"original_price":37000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/l6fHTvaBFpcRCRizOkb1EoLWR0nB18xUkpAmknKz.jpg","options":[]},{"id":"122","brand_id":"janjijiwa","name":"Smooked Beef n Cheese","category":"Jiwa Toast","description":"","price":23500,"original_price":37000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/28q3MsMbkL8WZlH3Un7mLC7UkSD07D9KmLJfheAv.jpg","options":[]},{"id":"123","brand_id":"janjijiwa","name":"Spicy Bulgogi","category":"Jiwa Toast","description":"","price":23500,"original_price":37000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/edlxl6ooATCf9hwbxuhoPecTpCsrg1axqrc47RPf.jpg","options":[]},{"id":"124","brand_id":"janjijiwa","name":"Beef Truffle Mayo","category":"Jiwa Toast","description":"","price":23500,"original_price":37000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/sTG6Gm5f7UlqK8J0UmOftlRKsRQd2rXh23G9ZG5G.jpg","options":[]},{"id":"125","brand_id":"janjijiwa","name":"Crispy Spicy Chicken","category":"Jiwa Toast","description":"","price":23000,"original_price":36000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/b6RWFpotWTWWwljQgYWmWxPIs1kCj7eA7x7o7U1g.jpg","options":[]},{"id":"126","brand_id":"janjijiwa","name":"Crunchy Choco","category":"Jiwa Toast","description":"","price":23500,"original_price":37000,"image":"https:\/\/jasdorforyou.my.id\/storage\/products\/3FZK1u2USfwM60rXBRrffrOJrl9mUgRUAKdXJGnY.jpg","options":[]}],
        banners: [{"id":"banner-2","type":"promo","badge_text":"Promo Spesial \u2661","title":"Double coffee, double happy! \ud83e\udd0d\u2615","subtitle":"Kopi Kenangan Mantan 2 CUP LARGE \u2022 30K","button_text":"Order Sekarang","target_action":"brands","target_brand_id":null,"image":"https:\/\/jasdorforyou.my.id\/storage\/banners\/OH09R4t8nvBVBeQOPPjdB5UfhNoRBaQDlFQm3VWv.png","hero_images":[]},{"id":"banner-3","type":"promo","badge_text":"Helooww \u2661","title":"Bestie, let\u0027s frapp\u00e9! \ud83e\uddf8","subtitle":"Promo Spesial Bundling Frappe 2 Cup \u2661","button_text":"Order Sekarang","target_action":"catalog","target_brand_id":null,"image":"https:\/\/jasdorforyou.my.id\/storage\/banners\/tUwICqpySraZOwRbgW7uReEPfT7DPYajV0MdfwEl.jpg","hero_images":[]}],
        config: {"store_name":"jasdor.foryou","logo_url":"\/storage\/settings\/42BfR730JRmaWAOzHzgsTPnS2hrOi43xuGT27EZ0.png","tagline":"Sip Your Happiness \u2661","sub_tagline":"Satu tempat untuk berbagai minuman kesayanganmu \u2661","admin_wa":"6285148354530","operating_hours":"","is_store_open":true},

        // Navigasi State Flow ('opening' | 'brands' | 'outlets' | 'catalog')
        currentView: 'catalog',

        // Brand & Filter State
        activeBrandId: 'fore',
        selectedCategory: 'Semua Menu',
        searchQuery: '',
        sortBy: 'default',

        // Pagination State (Ala Filament)
        currentPage: 1,
        perPage: 12,

        // Realtime Outlet & Menu State (Hydrated dari Controller / Redis)
        selectedOutlet: null,
        outletsList: [],
        isLoadingOutlets: false,
        loadingStoreCode: null,
        outletSearchQuery: 'Samarinda',
        userLat: -0.502106,
        userLng: 117.153709,
        liveProducts: [],
        liveCategories: ["Semua Menu"],

        // Toast Feedback
        toastMessage: '',
        toastTimeout: null,

        // Slider Banner State (Ala jasdor-v2)
        currentBannerIndex: 0,
        bannerTimer: null,
        touchStartX: 0,
        touchEndX: 0,

        // Modal State & Dynamic Options (Instant Hydration & Zero-Flicker Cache)
        showStoreClosedModal: false,
        showCustomizeModal: false,
        showCartDrawer: false,
        activeProduct: null,
        detailQty: 1,
        isLoadingOptions: false,
        loadingProductCustomizeId: null,
        productOptionsData: null,
        optionsCache: {},
        isSubmittingOrder: false,

        // Opsi Form Kustomisasi Dinamis (100% Realtime API Driven)
        selectedDimensions: {},
        selectedNotes: {},
        selectedAddons: [],
        customizationNote: '',

        // Modal Alert Universal (Pengganti alert() browser)
        alertModal: {
            show: false,
            title: 'Perhatian ♡',
            message: '',
            type: 'warning',
            buttonText: 'Oke, Mengerti ♡'
        },

        showAlert(message, title = 'Perhatian ♡', type = 'warning', buttonText = 'Oke, Mengerti ♡') {
            this.alertModal.message = message;
            this.alertModal.title = title;
            this.alertModal.type = type;
            this.alertModal.buttonText = buttonText;
            this.alertModal.show = true;
        },

        closeAlert() {
            this.alertModal.show = false;
        },

        isFoodProduct(product) {
            if (!product) return false;
            const cat = String(product.category || '').toLowerCase();
            const name = String(product.name || '').toLowerCase();

            const foodKeywords = [
                'food', 'makanan', 'bakery', 'pastry', 'toast', 'snack', 'bread', 'roti',
                'bagel', 'croissant', 'sandwich', 'cookie', 'cookies', 'cake', 'muffin',
                'danish', 'quiche', 'pie', 'donut', 'donat', 'cemilan', 'bites', 'dessert',
                'brownie', 'puff', 'waffle', 'pancake', 'pasta', 'fries', 'chigo', 'chicken',
                'bun', 'macaroni', 'spaghetti', 'burger'
            ];

            return foodKeywords.some(kw => cat.includes(kw) || name.includes(kw));
        },

        // Keranjang & Form
        cart: [],
        checkoutForm: {
            name: '',
            phone: '',
            manualOutlet: '',
            pickupType: 'now',
            pickupTime: '09:00'
        },

        get pickupTimeSlots() {
            const slots = [];
            for (let h = 7; h <= 22; h++) {
                for (let m = 0; m < 60; m += 15) {
                    const hh = String(h).padStart(2, '0');
                    const mm = String(m).padStart(2, '0');
                    slots.push(`${hh}:${mm}`);
                }
            }
            return slots;
        },

        init() {
            if (this.config && this.config.is_store_open === false) {
                this.showStoreClosedModal = true;
            }
            this.startBannerAutoSlide();
            this.restoreCartFromSession();
            this.restoreStateFromUrl();
            window.addEventListener('popstate', () => {
                this.restoreStateFromUrl();
            });
            this.$watch('currentView', () => this.syncUrlState());
            this.$watch('activeBrandId', () => this.syncUrlState());
            this.$watch('selectedCategory', () => {
                this.currentPage = 1;
                this.syncUrlState();
            });
            this.$watch('searchQuery', () => {
                this.currentPage = 1;
            });
            this.$watch('sortBy', () => {
                this.currentPage = 1;
            });
        },

        restoreCartFromSession() {
            const savedCart = sessionStorage.getItem('jasdor_cart');
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart);
                    if (Array.isArray(parsed)) {
                        this.cart = parsed;
                    }
                } catch(e) {}
            }
        },

        syncCartToSession() {
            sessionStorage.setItem('jasdor_cart', JSON.stringify(this.cart));
        },

        syncUrlState() {
            const url = new URL(window.location);
            if (this.currentView !== 'opening') {
                url.searchParams.set('view', this.currentView);
            } else {
                url.searchParams.delete('view');
            }

            if (this.activeBrandId && this.currentView !== 'opening') {
                url.searchParams.set('brand', this.activeBrandId);
            } else {
                url.searchParams.delete('brand');
            }

            if (this.selectedOutlet && this.selectedOutlet.code && this.activeBrandId === 'kopken' && (this.currentView === 'catalog' || this.currentView === 'cart')) {
                url.searchParams.set('outlet', this.selectedOutlet.code);
                sessionStorage.setItem('jasdor_selected_outlet', JSON.stringify(this.selectedOutlet));
            } else {
                url.searchParams.delete('outlet');
                if (this.currentView === 'brands' || this.currentView === 'opening') {
                    sessionStorage.removeItem('jasdor_selected_outlet');
                }
            }

            if (this.selectedCategory && this.selectedCategory !== 'Semua Menu' && this.currentView === 'catalog') {
                url.searchParams.set('cat', this.selectedCategory);
            } else {
                url.searchParams.delete('cat');
            }

            window.history.replaceState({}, '', url);
        },

        async restoreStateFromUrl() {
            const params = new URLSearchParams(window.location.search);
            const view = params.get('view');
            const brand = params.get('brand');
            const outletCode = params.get('outlet');
            const cat = params.get('cat');

            if (brand) {
                this.activeBrandId = brand;
            }

            if (outletCode && this.activeBrandId === 'kopken') {
                const savedOutlet = sessionStorage.getItem('jasdor_selected_outlet');
                if (savedOutlet && !this.selectedOutlet) {
                    try {
                        const parsed = JSON.parse(savedOutlet);
                        if (parsed.code === outletCode) {
                            this.selectedOutlet = parsed;
                        }
                    } catch(e) {}
                }

                if (this.liveProducts.length === 0) {
                    await this.loadMenuForOutlet(outletCode);
                }
                if (cat) {
                    this.selectedCategory = cat;
                }
                if (view === 'cart') {
                    this.currentView = 'cart';
                } else {
                    this.currentView = 'catalog';
                }
                return;
            }

            if (view) {
                this.currentView = view;
                if (view === 'outlets' && this.outletsList.length === 0) {
                    this.loadOutlets(this.outletSearchQuery);
                }
            }
        },

        async loadMenuForOutlet(storeCode) {
            try {
                const url = `/api/brand/kopken/menu?store_code=${encodeURIComponent(storeCode)}`;
                const res = await fetch(url).then(r => r.json());
                if (res.success) {
                    this.liveCategories = res.categories || ['Semua Menu'];
                    this.liveProducts = res.products || [];
                    if (!this.selectedOutlet) {
                        this.selectedOutlet = {
                            code: storeCode,
                            name: 'Cabang ' + storeCode,
                            address: 'Kopi Kenangan'
                        };
                    }
                }
            } catch(e) {
                console.error('Gagal memuat menu dari url state:', e);
            }
        },

        showToast(msg) {
            this.toastMessage = msg;
            if (this.toastTimeout) clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                this.toastMessage = '';
            }, 2500);
        },

        // ==========================================
        // Banner Slider Logic (Diadopsi dari jasdor-v2)
        // ==========================================
        startBannerAutoSlide() {
            this.pauseBannerAutoSlide();
            if (this.banners && this.banners.length > 1) {
                this.bannerTimer = setInterval(() => {
                    this.nextBannerSlide();
                }, 4000);
            }
        },

        pauseBannerAutoSlide() {
            if (this.bannerTimer) {
                clearInterval(this.bannerTimer);
                this.bannerTimer = null;
            }
        },

        resumeBannerAutoSlide() {
            this.startBannerAutoSlide();
        },

        nextBannerSlide() {
            if (!this.banners || this.banners.length <= 1) return;
            this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
        },

        prevBannerSlide() {
            if (!this.banners || this.banners.length <= 1) return;
            this.currentBannerIndex = (this.currentBannerIndex - 1 + this.banners.length) % this.banners.length;
        },

        goToBannerSlide(idx) {
            this.currentBannerIndex = idx;
            this.startBannerAutoSlide();
        },

        handleBannerTouchStart(e) {
            this.touchStartX = e.touches[0].clientX;
            this.pauseBannerAutoSlide();
        },

        handleBannerTouchMove(e) {
            this.touchEndX = e.touches[0].clientX;
        },

        handleBannerTouchEnd() {
            const diff = this.touchStartX - this.touchEndX;
            if (Math.abs(diff) > 40) {
                if (diff > 0) {
                    this.nextBannerSlide();
                } else {
                    this.prevBannerSlide();
                }
            }
            this.resumeBannerAutoSlide();
        },

        // ==========================================
        // Katalog & Filter Logic
        // ==========================================
        get activeBrand() {
            return this.brands.find(b => b.id === this.activeBrandId) || this.brands[0];
        },

        get activeBrandName() {
            return this.activeBrand ? this.activeBrand.name : 'Kopi Kenangan';
        },

        get activeBrandAdminFee() {
            return this.activeBrand ? this.activeBrand.admin_fee : 3000;
        },

        get activeBrandCategories() {
            if (this.activeBrandId === 'kopken' && this.liveCategories.length > 0) {
                return this.liveCategories;
            }
            const brandProds = this.products.filter(p => p.brand_id === this.activeBrandId);
            const dynamicCats = [...new Set(brandProds.map(p => p.category).filter(Boolean))];
            if (dynamicCats.length > 0) {
                return ['Semua Menu', ...dynamicCats];
            }
            return this.activeBrand?.categories || ['Semua Menu', 'Coffee', 'Non Coffee'];
        },

        get filteredProducts() {
            const sourceList = (this.activeBrandId === 'kopken')
                ? this.liveProducts
                : this.products.filter(p => p.brand_id === this.activeBrandId);

            return sourceList.filter(p => {
                const matchCat = this.selectedCategory === 'Semua Menu' ||
                                 (Array.isArray(p.categories) ? p.categories.includes(this.selectedCategory) : p.category === this.selectedCategory);
                const matchSearch = this.searchQuery === '' ||
                                    p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                return matchCat && matchSearch;
            }).sort((a, b) => {
                if (this.sortBy === 'price_low') return a.price - b.price;
                if (this.sortBy === 'price_high') return b.price - a.price;
                return 0;
            });
        },

        get totalPages() {
            return Math.ceil(this.filteredProducts.length / this.perPage) || 1;
        },

        get paginatedProducts() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.filteredProducts.slice(start, start + this.perPage);
        },

        get paginationFrom() {
            if (this.filteredProducts.length === 0) return 0;
            return (this.currentPage - 1) * this.perPage + 1;
        },

        get paginationTo() {
            return Math.min(this.currentPage * this.perPage, this.filteredProducts.length);
        },

        get paginationPages() {
            const total = this.totalPages;
            const current = this.currentPage;
            if (total <= 6) {
                return Array.from({length: total}, (_, i) => i + 1);
            }
            const pages = [];
            if (current <= 3) {
                pages.push(1, 2, 3, 4, '...', total);
            } else if (current >= total - 2) {
                pages.push(1, '...', total - 3, total - 2, total - 1, total);
            } else {
                pages.push(1, '...', current - 1, current, current + 1, '...', total);
            }
            return pages;
        },

        setPage(p) {
            if (p === '...' || p < 1 || p > this.totalPages) return;
            this.currentPage = p;
            this.scrollToCatalogTop();
        },

        prevPage() {
            if (this.currentPage > 1) {
                this.setPage(this.currentPage - 1);
            }
        },

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.setPage(this.currentPage + 1);
            }
        },

        setPerPage(count) {
            this.perPage = Number(count);
            this.currentPage = 1;
        },

        scrollToCatalogTop() {
            const el = document.getElementById('menu-catalog-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        get cartTotalCount() {
            return this.cart.reduce((sum, item) => sum + item.qty, 0);
        },

        get cartSubtotal() {
            return this.cart.reduce((sum, item) => sum + ((item.unitPrice || item.product.price) * item.qty), 0);
        },

        get kopkenMinOrderMet() {
            if (this.activeBrandId !== 'kopken') return true;
            return this.cartTotalCount >= 2 && this.cartSubtotal >= 30000;
        },

        get kopkenMinOrderMessage() {
            if (this.activeBrandId !== 'kopken') return '';
            const missingCups = Math.max(0, 2 - this.cartTotalCount);
            const missingAmount = Math.max(0, 30000 - this.cartSubtotal);

            if (missingCups > 0 && missingAmount > 0) {
                return `Tambah ${missingCups} cup lagi & kurang Rp ${missingAmount.toLocaleString('id-ID')} untuk memenuhi minimal 2 cup & Rp 30.000 (Harga Promo Kopken) ♡`;
            } else if (missingCups > 0) {
                return `Tambah ${missingCups} cup lagi (Minimal order Kopi Kenangan: 2 cup) ♡`;
            } else if (missingAmount > 0) {
                return `Tambah pesanan sebesar Rp ${missingAmount.toLocaleString('id-ID')} lagi untuk memenuhi syarat minimal order 30.000 ♡`;
            }
            return '';
        },

        get hasProductOptions() {
            if (!this.productOptionsData) return false;
            const hasDims = Array.isArray(this.productOptionsData.dimensions) && this.productOptionsData.dimensions.length > 0;
            const hasNotes = Array.isArray(this.productOptionsData.notes) && this.productOptionsData.notes.length > 0;
            const hasAddons = Array.isArray(this.productOptionsData.addons) && this.productOptionsData.addons.length > 0;
            return hasDims || hasNotes || hasAddons;
        },

        get currentVariantKey() {
            if (!this.productOptionsData?.dimensions || this.productOptionsData.dimensions.length === 0) {
                return '';
            }
            return this.productOptionsData.dimensions
                .map(d => `${d.code}-${this.selectedDimensions[d.code] || d.values[0]?.id}`)
                .join(':') + ':';
        },

        get currentVariant() {
            const key = this.currentVariantKey;
            if (this.productOptionsData?.variants && this.productOptionsData.variants[key]) {
                return this.productOptionsData.variants[key];
            }
            return null;
        },

        get customizedUnitPrice() {
            if (!this.activeProduct) return 0;
            let price = Number(this.activeProduct.price) || 0;

            // Tambahkan ekstra harga dimensi jika ada opsi produk
            if (this.productOptionsData && Array.isArray(this.productOptionsData.dimensions)) {
                this.productOptionsData.dimensions.forEach(dim => {
                    const chosenValId = this.selectedDimensions[dim.code];
                    if (chosenValId) {
                        price += this.getDimensionExtraPrice(dim.code, chosenValId);
                    }
                });
            }

            if (Array.isArray(this.selectedAddons)) {
                this.selectedAddons.forEach(a => {
                    price += Number(a.price || 0);
                });
            }
            return price;
        },

        get customizedTotalPrice() {
            return this.customizedUnitPrice * this.detailQty;
        },

        isNoteVisible(note) {
            if (!note) return true;
            if (note.invisibleWhen) {
                for (const [dimCode, hideValId] of Object.entries(note.invisibleWhen)) {
                    if (Number(this.selectedDimensions[dimCode]) === Number(hideValId)) {
                        return false;
                    }
                }
            }
            // Sembunyikan otomatis jika suhu yang dipilih mengandung kata 'HOT'
            const opts = this.productOptionsData;
            if (opts && Array.isArray(opts.dimensions)) {
                const tempDim = opts.dimensions.find(d => (d.title || '').toLowerCase().includes('temp'));
                if (tempDim) {
                    const chosenValId = this.selectedDimensions[tempDim.code];
                    const chosenVal = tempDim.values?.find(v => v.id === chosenValId);
                    if (chosenVal && (chosenVal.label || '').toUpperCase().includes('HOT')) {
                        const noteTitle = (note.title || '').toLowerCase();
                        if (noteTitle.includes('ice') || noteTitle.includes('es')) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },

        isProductFood(product) {
            if (!product) return false;
            const cat = (product.category || '').toLowerCase();
            const name = (product.name || '').toLowerCase();

            // Pengecualian mutlak: kata kunci minuman PASTI BUKAN MAKANAN
            const drinkKeywords = [
                'latte', 'coffee', 'kopi', 'espresso', 'cappuccino', 'tea', 'teh', 'matcha',
                'macchiato', 'americano', 'frappe', 'chocolate', 'cokelat', 'drink', 'beverage',
                'boba', 'juice', 'jus', 'shake', 'ice', 'iced', 'hot', 'cold', 'brew'
            ];
            if (drinkKeywords.some(kw => name.includes(kw) || cat.includes(kw))) {
                return false;
            }

            if (product.is_food === true || product.isFood === true) return true;

            const foodKeywords = [
                'food', 'makanan', 'bakery', 'pastry', 'roti', 'toast', 'croissant',
                'bagel', 'donut', 'doughnut', 'cookie', 'cookies', 'bread', 'cake',
                'chiffon', 'pie', 'sandwich', 'muffin', 'waffle', 'puff', 'snack', 'bun',
                'chigo', 'chicken', 'ayam', 'nasi', 'rice', 'mie', 'noodle', 'pasta'
            ];
            return foodKeywords.some(kw => cat.includes(kw) || name.includes(kw));
        },

        getDimensionExtraPrice(dimCode, valId) {
            const opts = this.productOptionsData;
            if (!opts || !Array.isArray(opts.dimensions)) return 0;

            const dim = opts.dimensions.find(d => d.code === dimCode);
            if (!dim) return 0;
            const val = dim.values?.find(v => v.id === valId);
            if (!val) return 0;

            const titleLower = (dim.title || '').toLowerCase();
            const labelLower = (val.label || '').toLowerCase();

            // Aturan Kopi Kenangan:
            // 1. Size Large flat +Rp 5.000 (sesuai arahan user), Jumbo dinonaktifkan
            if (titleLower.includes('size') || titleLower.includes('ukuran')) {
                if (labelLower.includes('large')) return 5000;
                return 0;
            }

            // 2. Beans: Juwara Beans +Rp 3.000, Kenangan Blend Rp 0
            if (titleLower.includes('bean')) {
                if (labelLower.includes('juwara')) return 3000;
                return 0;
            }

            // 3. Milk: Oatside +Rp 2.000, Milk Biasa Rp 0
            if (titleLower.includes('milk') || titleLower.includes('susu')) {
                if (labelLower.includes('oatside')) return 2000;
                return 0;
            }

            // 4. Sugar & Temperature: Free (Rp 0)
            if (titleLower.includes('sugar') || titleLower.includes('gula') || titleLower.includes('temp') || titleLower.includes('suhu')) {
                return 0;
            }

            // Fallback kalkulasi dari data variants jika ada dimensi lain
            if (opts.variants) {
                const baseKey = opts.dimensions
                    .map(d => `${d.code}-${opts.default_selection?.[d.code] || d.values[0]?.id}`)
                    .join(':') + ':';
                const baseVar = opts.variants[baseKey];
                const baseVarPrice = baseVar ? baseVar.price : (opts.base_product?.price || 0);

                const testKey = opts.dimensions
                    .map(d => {
                        const chosen = (d.code === dimCode) ? valId : (opts.default_selection?.[d.code] || d.values[0]?.id);
                        return `${d.code}-${chosen}`;
                    })
                    .join(':') + ':';
                const testVar = opts.variants[testKey];
                if (testVar && baseVarPrice) {
                    return Math.max(0, testVar.price - baseVarPrice);
                }
            }

            return 0;
        },

        toggleAddon(item, groupTitle) {
            const idx = this.selectedAddons.findIndex(a => a.id === item.id);
            if (idx > -1) {
                this.selectedAddons.splice(idx, 1);
            } else {
                this.selectedAddons.push({
                    id: item.id,
                    label: item.label,
                    price: Number(item.price || 0),
                    icon: item.icon,
                    group: groupTitle
                });
            }
        },

        hasAddon(addonId) {
            return this.selectedAddons.some(a => a.id === addonId);
        },

        selectBrand(brandId) {
            this.activeBrandId = brandId;
            this.selectedCategory = 'Semua Menu';
            this.searchQuery = '';

            if (brandId === 'kopken') {
                this.currentView = 'outlets';
                if (this.outletsList.length === 0) {
                    this.loadOutlets(this.outletSearchQuery);
                }
            } else {
                this.currentView = 'catalog';
            }
            this.syncUrlState();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        async loadOutlets(search = '') {
            this.isLoadingOutlets = true;
            try {
                const url = `/api/brand/kopken/outlets?search=${encodeURIComponent(search)}&lat=${this.userLat}&lng=${this.userLng}`;
                const res = await fetch(url).then(r => r.json());
                if (res.success && Array.isArray(res.data)) {
                    this.outletsList = res.data;
                }
            } catch (err) {
                console.error('Gagal mengambil outlet live:', err);
                this.showToast('Gagal memuat outlet live, coba sesaat lagi.');
            } finally {
                this.isLoadingOutlets = false;
            }
        },

        searchOutlets() {
            this.loadOutlets(this.outletSearchQuery);
        },

        useCurrentLocation() {
            if (!navigator.geolocation) {
                this.showAlert('Browser Anda tidak mendukung deteksi GPS.', 'GPS Tidak Didukung', 'info');
                return;
            }
            this.showToast('Mendeteksi GPS lokasimu...');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.userLat = pos.coords.latitude;
                    this.userLng = pos.coords.longitude;
                    this.outletSearchQuery = '';
                    this.loadOutlets('');
                    this.showToast('Berhasil menemukan outlet terdekat via GPS!');
                },
                (err) => {
                    this.showAlert('Tidak dapat mendeteksi lokasi GPS. Silakan ketik nama kota manual yaa ♡', 'Lokasi Tidak Terdeteksi', 'info');
                },
                { timeout: 8000 }
            );
        },

        async selectOutlet(outlet) {
            if (!outlet || outlet.is_open === false) {
                this.showToast('Maaf, cabang ini sedang tutup.');
                return;
            }
            this.selectedOutlet = outlet;
            this.loadingStoreCode = outlet.code;
            try {
                const url = `/api/brand/kopken/menu?store_code=${encodeURIComponent(outlet.code)}`;
                const res = await fetch(url).then(r => r.json());
                if (res.success) {
                    this.liveCategories = res.categories || ['Semua Menu'];
                    this.liveProducts = res.products || [];
                    this.selectedCategory = 'Semua Menu';
                    this.searchQuery = '';
                    this.currentView = 'catalog';
                    this.syncUrlState();
                    this.showToast(`Menu cabang ${outlet.name} berhasil dimuat!`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                console.error('Gagal memuat menu live cabang:', err);
                this.showToast('Gagal memuat menu cabang ini.');
            } finally {
                this.loadingStoreCode = null;
            }
        },

        async openCustomizeModal(product) {
            this.activeProduct = product;
            this.detailQty = 1;
            this.customizationNote = '';
            this.selectedAddons = [];
            this.selectedDimensions = {};
            this.selectedNotes = {};
            this.productOptionsData = null;
            this.showCustomizeModal = true;

            const storeCode = this.selectedOutlet?.code || '1001';
            const cacheKey = storeCode + '_' + product.id;
            let options = this.optionsCache[cacheKey] || null;

            if (!options && this.activeBrandId === 'kopken' && product.id) {
                this.loadingProductCustomizeId = product.id;
                this.isLoadingOptions = true;
                try {
                    const url = `/api/brand/kopken/options?store_code=${encodeURIComponent(storeCode)}&product_id=${encodeURIComponent(product.id)}`;
                    const res = await fetch(url).then(r => r.json());
                    if (res.success && res.options) {
                        options = res.options;
                        this.optionsCache[cacheKey] = options;
                    }
                } catch(e) {
                    console.error('Gagal mengambil options produk:', e);
                } finally {
                    this.isLoadingOptions = false;
                    this.loadingProductCustomizeId = null;
                }
            }

            this.productOptionsData = options;

            // Inisialisasi selectedDimensions dari default_selection API atau opsi pertama (Pastikan Jumbo tidak terpilih default)
            if (options && Array.isArray(options.dimensions)) {
                options.dimensions.forEach(dim => {
                    let defVal = options.default_selection?.[dim.code];
                    const chosen = dim.values?.find(v => v.id === defVal);
                    if (!defVal || (chosen && (chosen.label || '').toLowerCase().includes('jumbo'))) {
                        defVal = dim.values?.find(v => !(v.label || '').toLowerCase().includes('jumbo'))?.id || dim.values?.[0]?.id;
                    }
                    if (defVal) {
                        this.selectedDimensions[dim.code] = defVal;
                    }
                });
            }

            // Inisialisasi selectedNotes dari defaultValue atau opsi pertama
            if (options && Array.isArray(options.notes)) {
                options.notes.forEach(n => {
                    const defVal = n.defaultValue || (n.values?.[0]?.id);
                    if (defVal) {
                        this.selectedNotes[n.code] = defVal;
                    }
                });
            }
        },

        closeCustomizeModal() {
            this.showCustomizeModal = false;
        },

        decrementDetailQty(e) {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            if (this.detailQty > 1) {
                this.detailQty--;
            }
        },

        incrementDetailQty(e) {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            this.detailQty++;
        },

        addToCartFromDetail(e) {
            return this.addToCartFromCustomize(e);
        },

        addToCartFromCustomize(e) {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            if (this.config && this.config.is_store_open === false) {
                this.showStoreClosedModal = true;
                return;
            }

            if (!this.activeProduct) return;

            const opts = this.productOptionsData;
            const hasDims = opts && Array.isArray(opts.dimensions) && opts.dimensions.length > 0;

            let tempLabel = null;
            let sizeLabel = null;
            let beansLabel = null;
            let milkLabel = null;
            let sugarLabel = null;
            let iceLabel = null;

            if (hasDims) {
                opts.dimensions.forEach(d => {
                    const titleLower = (d.title || '').toLowerCase();
                    const chosenId = this.selectedDimensions[d.code];
                    const chosenVal = d.values?.find(v => v.id === chosenId) || d.values?.[0];
                    const label = chosenVal?.label || null;

                    if (titleLower.includes('temp')) tempLabel = label;
                    else if (titleLower.includes('size')) sizeLabel = label;
                    else if (titleLower.includes('bean')) beansLabel = label;
                    else if (titleLower.includes('milk')) milkLabel = label;
                    else if (titleLower.includes('sugar')) sugarLabel = label;
                });
            }

            if (opts && Array.isArray(opts.notes)) {
                opts.notes.forEach(n => {
                    if (this.isNoteVisible(n)) {
                        const chosenId = this.selectedNotes[n.code];
                        const chosenVal = n.values?.find(v => v.id === chosenId) || n.values?.[0];
                        const titleLower = (n.title || '').toLowerCase();
                        if (titleLower.includes('ice')) {
                            iceLabel = chosenVal?.label || null;
                        }
                    }
                });
            }

            const syrups = this.selectedAddons.filter(a => (a.group || '').toLowerCase().includes('syrup'))
                .map(s => ({ name: s.label, price: s.price, icon: s.icon }));
            const toppings = this.selectedAddons.filter(a => !(a.group || '').toLowerCase().includes('syrup'))
                .map(t => ({ name: t.label, price: t.price, icon: t.icon }));

            const unitPrice = this.customizedUnitPrice;

            this.cart.push({
                product: {
                    ...this.activeProduct,
                    price: unitPrice
                },
                basePrice: this.activeProduct.price,
                unitPrice: unitPrice,
                qty: this.detailQty,
                temp: tempLabel,
                size: sizeLabel,
                beans: beansLabel,
                milk: milkLabel,
                sugar: sugarLabel,
                ice: iceLabel,
                syrups: syrups,
                toppings: toppings,
                note: this.customizationNote,
                isFood: this.isProductFood(this.activeProduct)
            });

            this.syncCartToSession();
            this.closeCustomizeModal();
            this.showToast(`Berhasil menambahkan ${this.activeProduct.name} ke keranjang!`);
        },

        updateCartQty(idx, delta) {
            this.cart[idx].qty += delta;
            if (this.cart[idx].qty <= 0) {
                this.cart.splice(idx, 1);
            }
            this.syncCartToSession();
        },

        openCartDrawer() {
            this.currentView = 'cart';
            this.syncUrlState();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        async submitOrderToWhatsApp() {
            if (this.config && this.config.is_store_open === false) {
                this.showStoreClosedModal = true;
                return;
            }

            if (!this.kopkenMinOrderMet) {
                this.showAlert(
                    'Sorry, untuk produk Kopi Kenangan berlaku minimal order 2 cup (Reguler/Large) dengan total minimal belanja Rp 30.000 dengan harga promo yaa ♡\n\n' + this.kopkenMinOrderMessage,
                    'Minimal Belanja Kopi Kenangan ♡',
                    'warning',
                    'Tambah Pesanan Lagi ♡'
                );
                return;
            }

            if (!this.checkoutForm.name.trim()) {
                this.showAlert('Mohon masukkan Nama Pemesan terlebih dahulu agar dapat proses pesananmu ♡', 'Nama Pemesan Diperlukan ♡');
                return;
            }

            const cleanPhone = this.checkoutForm.phone.replace(/[^0-9]/g, '');
            if (!cleanPhone || cleanPhone.length < 9) {
                this.showAlert('Mohon masukkan Nomor WhatsApp yang valid!', 'Nomor WhatsApp Tidak Valid ♡');
                return;
            }
            this.checkoutForm.phone = cleanPhone;

            // Validasi Outlet Pengambilan
            if (this.activeBrandId === 'kopken') {
                if (!this.selectedOutlet || !this.selectedOutlet.name) {
                    this.showAlert('Mohon pilih cabang Kopi Kenangan terlebih dahulu ♡', 'Cabang Belum Dipilih ♡');
                    return;
                }
            } else {
                if (!this.checkoutForm.manualOutlet || !this.checkoutForm.manualOutlet.trim()) {
                    this.showAlert('Mohon tuliskan nama cabang / outlet pengambilan terlebih dahulu agar jastiper kami dapat membelikannya dengan tepat ♡', 'Cabang/Outlet Belum Diisi ♡');
                    return;
                }
            }

            const total = this.cartSubtotal;
            const pickupDisplay = this.checkoutForm.pickupType === 'now'
                ? 'Sekarang'
                : (this.checkoutForm.pickupTime || 'Nanti');

            const orderOutletName = this.activeBrandId === 'kopken'
                ? (this.selectedOutlet?.name || null)
                : this.checkoutForm.manualOutlet.trim();
            const orderOutletAddress = this.activeBrandId === 'kopken'
                ? (this.selectedOutlet?.address || null)
                : null;

            if (this.isSubmittingOrder) return;
            this.isSubmittingOrder = true;

            let orderNumber = null;

            // Simpan pesanan ke database secara async & dapatkan nomor pesanan resmi
            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': '9Tu6x6qGwYUtvxeUo9RjsJCU5PnZx1Li3vGyXhvE'
                    },
                    body: JSON.stringify({
                        customer_name: this.checkoutForm.name,
                        customer_phone: this.checkoutForm.phone,
                        brand_id: this.activeBrandId,
                        brand_name: this.activeBrandName,
                        outlet_name: orderOutletName,
                        outlet_address: orderOutletAddress,
                        pickup_type: this.checkoutForm.pickupType,
                        pickup_time: pickupDisplay,
                        grand_total: total,
                        items: this.cart
                    })
                });

                const res = await response.json();

                if (!response.ok || !res || !res.success || !res.order_number) {
                    const errorMsg = res?.message || 'Gagal menyimpan pesanan ke sistem. Silakan periksa kembali keranjang Anda ♡';
                    this.showAlert(errorMsg, 'Pesanan Belum Tersimpan ♡', 'warning');
                    this.isSubmittingOrder = false;
                    return;
                }

                orderNumber = res.order_number;
            } catch (e) {
                console.error('Gagal menyimpan pesanan ke database sebelum buka WhatsApp:', e);
                this.showAlert('Terjadi gangguan koneksi saat menyimpan pesanan ke sistem. Silakan coba beberapa saat lagi ♡', 'Gagal Terhubung ♡', 'warning');
                this.isSubmittingOrder = false;
                return;
            } finally {
                this.isSubmittingOrder = false;
            }

            const storeName = this.config?.store_name || 'jasdor.foryou';
            const outletDisplay = orderOutletName || (this.activeBrandName || '-');

            let text = `🛒 ${storeName} ♡\n`;
            text += `     order for you, enjoy more\n`;
            text += `--------------------------------\n`;
            text += `          ORDER RECEIPT\n`;
            text += `--------------------------------\n`;
            text += `🗳️ No. Order  : ${orderNumber}\n`;
            text += `👤 Customer  : ${this.checkoutForm.name}\n`;
            text += `📍 Outlet        : ${outletDisplay}\n`;
            text += `🕓 Pickup       : ${pickupDisplay}\n\n`;
            text += `📋 DETAIL PESANAN : ${this.activeBrandName}\n`;

            this.cart.forEach((c) => {
                text += `${c.qty}x ${c.product.name}\n`;
                let details = [];
                if (c.size) details.push(c.size);
                if (c.ice && c.temp === 'Ice') details.push(c.ice);
                else if (c.temp) details.push(c.temp);
                if (details.length > 0) {
                    text += `→ ${details.join(' • ')}\n`;
                }

                let subDetails = [];
                if (c.beans) subDetails.push(c.beans);
                if (c.milk) subDetails.push(c.milk);
                if (c.sugar) subDetails.push(c.sugar);
                if (c.syrups && c.syrups.length > 0) {
                    subDetails.push(c.syrups.map(s => s.name).join(', '));
                }
                if (c.toppings && c.toppings.length > 0) {
                    subDetails.push(c.toppings.map(t => t.name).join(', '));
                }
                if (subDetails.length > 0) {
                    text += `    ${subDetails.join(' • ')}\n`;
                }
                if (c.note) {
                    text += `    Catatan: ${c.note}\n`;
                }
            });

            text += `--------------------------------\n`;
            text += `Estimasi Total     Rp${total.toLocaleString('id-ID')}\n`;
            text += `--------------------------------\n`;
            text += `Status : Menunggu Konfirmasi Admin\n\n`;
            text += `Mohon tunggu konfirmasi admin\nsebelum melakukan pembayaran ♡\n\n`;
            text += `   thank you for trusting us 🤎\n`;
            text += `          @${storeName}\n`;
            text += `--------------------------------`;

            const adminWa = this.config?.admin_wa || '6281521692248';
            const waUrl = `https://wa.me/${adminWa}?text=${encodeURIComponent(text)}`;

            // Kosongkan keranjang setelah pesanan berhasil disimpan
            this.cart = [];
            this.syncCartToSession();

            window.location.href = waUrl;
        }
    };
}
