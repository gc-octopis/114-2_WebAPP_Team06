/**
 * Announcements API service
 * Provides functions to fetch announcements from backend.
 */

export class AnnouncementAPI {
    /**
     * Normalize language code for API.
     * Converts zh-TW to zh and keeps en as is.
     */
    static normalizeLanguage(lang) {
        if (lang === 'zh-TW' || lang === 'zh') {
            return 'zh';
        }
        return lang === 'en' ? 'en' : 'zh';
    }

    static async getAnnouncements(lang = 'zh-TW', options = {}) {
        try {
            const normalizedLang = this.normalizeLanguage(lang);
            const params = new URLSearchParams({ lang: normalizedLang });

            if (options.category) {
                params.append('category', options.category);
            }
            if (options.page) {
                params.append('page', String(options.page));
            }
            if (options.page_size) {
                params.append('page_size', String(options.page_size));
            }

            const response = await fetch(`/api/announcements/?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return {
                announcements: data.announcements || [],
                categories: data.categories || [],
                count: data.count || 0,
                page: data.page || 1,
                page_size: data.page_size || (options.page_size || 10),
                total_pages: data.total_pages || 0,
            };
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
            return {
                announcements: [],
                categories: [],
                count: 0,
                page: 1,
                page_size: options.page_size || 10,
                total_pages: 0,
            };
        }
    }
}
