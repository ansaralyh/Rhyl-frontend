const fs = require('fs');
let content = fs.readFileSync('products.html', 'utf8').replace(/^\uFEFF/, '');
const startIdx = content.indexOf('<!-- Hero Banner Slider -->');
const endIdx = content.indexOf('<!-- Premium Footer -->');

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = content.slice(0, startIdx) +
        `<!-- Product Listing Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" x-data="categoryPage()">
        <div class="flex items-end justify-between mb-8">
            <div class="space-y-2">
                <div class="h-1 w-12 bg-blue-500 rounded-full"></div>
                <h2 class="text-3xl md:text-4xl font-black text-slate-900" x-text="categoryTitle"></h2>
            </div>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <template x-for="product in categoryProducts" :key="product._id">
                <a :href="'product-detail.html?id=' + product._id"
                    class="product-card bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow">
                    <div class="image-zoom-container relative h-56 sm:h-64 bg-slate-50 flex items-center justify-center p-6 sm:p-8">
                        <img :src="product.image" :alt="product.name" class="max-w-full max-h-full object-contain drop-shadow-xl">
                    </div>
                    <div class="p-6 sm:p-8 flex flex-col flex-1 space-y-3">
                        <h3 class="font-bold text-slate-900 text-lg leading-snug line-clamp-2" x-text="product.name"></h3>
                        <div class="flex items-baseline gap-1 flex-wrap">
                            <span x-show="(product.discount || 0) > 0" class="text-xl font-black text-red-600 line-through mr-1" x-text="'£' + formatPrice(product.price)"></span>
                            <span class="text-3xl font-black text-blue-600" x-text="'£' + formatPrice(product.price * (1 - (product.discount || 0) / 100))"></span>
                            <span class="text-xs text-slate-400 font-medium">GBP</span>
                        </div>
                    </div>
                </a>
            </template>
        </div>
        
        <!-- Empty State -->
        <div x-show="categoryProducts.length === 0 && !loading" class="text-center py-20">
            <p class="text-slate-500 text-xl font-medium">No products found in this category.</p>
        </div>

        <!-- Pagination -->
        <div class="flex justify-center items-center gap-4" x-show="totalPages > 1">
            <button @click="changePage(-1)" :disabled="currentPage <= 1"
                class="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                Previous
            </button>
            <span class="text-slate-600 font-bold">
                Page <span x-text="currentPage"></span> of <span x-text="totalPages"></span>
            </span>
            <button @click="changePage(1)" :disabled="currentPage >= totalPages"
                class="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                Next
            </button>
        </div>
    </section>
` + content.slice(endIdx);
    fs.writeFileSync('products.html', newContent);
    console.log('Successfully trimmed and updated products.html');
} else {
    console.log('Could not find start/end markers in products.html');
}
