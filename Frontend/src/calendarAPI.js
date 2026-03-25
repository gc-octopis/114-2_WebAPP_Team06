/**
 * Calendar events API service
 * Provides functions to fetch calendar events from the backend
 */

export class CalendarEventAPI {
    /**
     * Fetch calendar events from the backend
     * @param {string} lang - Language code: 'zh' or 'en'
     * @param {Object} options - Optional filters
     * @param {string} options.start_date - Start date in YYYY-MM-DD format
     * @param {string} options.end_date - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of event objects
     */
    /**
     * Normalize language code for API
     * Converts 'zh-TW' to 'zh', keeps 'en' as is
     */
    static normalizeLanguage(lang) {
        if (lang === 'zh-TW' || lang === 'zh') {
            return 'zh';
        }
        return lang || 'zh';
    }

    static async getEvents(lang = 'zh-TW', options = {}) {
        try {
            const normalizedLang = this.normalizeLanguage(lang);
            const params = new URLSearchParams({ lang: normalizedLang });
            
            if (options.start_date) {
                params.append('start_date', options.start_date);
            }
            if (options.end_date) {
                params.append('end_date', options.end_date);
            }

            const response = await fetch(`/api/calendar/?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.events || [];
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
            return [];
        }
    }

    /**
     * Get events for a specific date
     * @param {Date} date - The date to query
     * @param {string} lang - Language code
     * @returns {Promise<Array>} Events on that date
     */
    static async getEventsForDate(date, lang = 'zh-TW') {
        const dateStr = date.toISOString().split('T')[0];
        return await this.getEvents(lang, {
            start_date: dateStr,
            end_date: dateStr,
        });
    }

    /**
     * Get events for a specific month
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @param {string} lang - Language code
     * @returns {Promise<Array>} Events in that month
     */
    static async getEventsForMonth(year, month, lang = 'zh-TW') {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        return await this.getEvents(lang, {
            start_date: startStr,
            end_date: endStr,
        });
    }
}
