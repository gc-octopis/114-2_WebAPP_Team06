// icsParser.js
export class ICSParser {
    constructor() {
        this.events = [];
    }

    async loadICS(filePath) {
        try {
            const response = await fetch(filePath);
            const text = await response.text();
            this.parseICS(text);
            return this.events; // Return events for React state
        } catch (error) {
            console.error('無法載入 ICS 檔案:', error);
            return [];
        }
    }

    parseICS(content) {
        this.events = [];
        const eventBlocks = content.split('BEGIN:VEVENT');
        
        for (let i = 1; i < eventBlocks.length; i++) {
            const blockContent = 'BEGIN:VEVENT' + eventBlocks[i];
            const event = this.parseEvent(blockContent);
            if (event) this.events.push(event);
        }

        this.events.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
    }

    parseEvent(blockContent) {
        const event = {};
        const unfolded = this.unfoldICSLines(blockContent);

        const summaryMatch = unfolded.match(/SUMMARY:([^\r\n]+)/);
        if (summaryMatch) event.summary = summaryMatch[1].trim();

        const dtStartMatch = unfolded.match(/DTSTART[^:]*:(\d{8})/);
        if (dtStartMatch) event.dateStart = this.parseICSDate(dtStartMatch[1]);

        const dtEndMatch = unfolded.match(/DTEND[^:]*:(\d{8})/);
        if (dtEndMatch) event.dateEnd = this.parseICSDate(dtEndMatch[1]);

        const locationMatch = unfolded.match(/LOCATION:([^\r\n]*)/);
        event.location = locationMatch ? locationMatch[1].trim() : '';

        const descMatch = unfolded.match(/DESCRIPTION:([^\r\n]+)/);
        event.description = descMatch ? descMatch[1].trim() : '';

        return event.summary ? event : null;
    }

    unfoldICSLines(text) {
        return text.replace(/\r?\n[ \t]/g, '');
    }

    parseICSDate(dateStr) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month - 1, day);
    }

    getEventsForDate(date) {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => 
            event.dateStart.toISOString().split('T')[0] === dateStr
        );
    }
}