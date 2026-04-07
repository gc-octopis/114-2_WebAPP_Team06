/**
 * Announcements API service
 * Provides functions to fetch announcements from backend.
 */

export class AnnouncementAPI {
    static async parseResponseBody(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        }

        const text = await response.text();
        return {
            error: `Non-JSON response (status ${response.status})`,
            raw: text,
        };
    }

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

    static async getFeedbackPosts(options = {}) {
        try {
            const params = new URLSearchParams();

            if (options.page) {
                params.append('page', String(options.page));
            }
            if (options.page_size) {
                params.append('page_size', String(options.page_size));
            }

            const queryString = params.toString();
            const url = queryString ? `/api/feedback/?${queryString}` : '/api/feedback/';
            const response = await fetch(url);
            const data = await this.parseResponseBody(response);

            if (!response.ok) {
                throw new Error(data.error || `API error: ${response.status}`);
            }

            return {
                posts: data.posts || [],
                count: data.count || 0,
                page: data.page || 1,
                page_size: data.page_size || (options.page_size || 10),
                total_pages: data.total_pages || 0,
            };
        } catch (error) {
            console.error('Failed to fetch feedback posts:', error);
            return {
                posts: [],
                count: 0,
                page: 1,
                page_size: options.page_size || 10,
                total_pages: 0,
            };
        }
    }

    static async createFeedbackPost(payload) {
        const response = await fetch('/api/feedback/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await this.parseResponseBody(response);
        if (!response.ok) {
            throw new Error(data.error || `API error: ${response.status}`);
        }
        return data;
    }
}
