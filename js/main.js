$(document).ready(function() {

    const players = Array.from(document.querySelectorAll('.js-player')).map(p => {
        const plr = new Plyr(p, {
            controls: [
                'play-large', // The large play button in the center         
                'play', // Play/pause playback      
                'progress', // The progress bar and scrubber for playback and buffering    
                // 'current-time', // The current time of playback    
                // 'duration', // The full duration of the media 
                'mute',
                'fullscreen'

            ],

            // fullscreen: { enabled: false, fallback: false, iosNative: false, container: null }

        })
    });

    const lightBoxCont = document.querySelectorAll('.lightbox--cont');
    lightBoxCont.forEach(el => {
        // console.log(el)

        const lightBox = el.querySelector('.lightbox');
        const closebtn = el.querySelector('.btn-close');
        const videoElement = el.querySelector('video');
        const bclick = el.querySelector('.gallery__item');


        bclick.addEventListener("click", event => {
            lightBox.className = "lightbox open";
            document.body.style.overflow = "hidden";

            // console.log(lightBox)
        });

        // closebtn.addEventListener("click", event => {
        //     lightBox.className = "lightbox";
        //     videoElement.pause();
        // });

        closebtn.addEventListener("click", event => {
            if (lightBox.className == "lightbox open") {
                lightBox.className = "lightbox";
                document.body.style.overflow = "auto";
                videoElement.pause();

            }
        });
    });

    // Calculate duration from date ranges
    function calculateDuration(dateRangeText) {
        // Extract dates from text like "Feb 2020 – May 2022" or "May 2022 – Current"
        const parts = dateRangeText.split('–').map(s => s.trim());
        if (parts.length !== 2) return '';
        
        const startDate = parseDate(parts[0]);
        const endDate = parts[1].toLowerCase() === 'current' ? new Date() : parseDate(parts[1]);
        
        if (!startDate || !endDate) return '';
        
        // Calculate difference in months
        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months += endDate.getMonth() - startDate.getMonth();
        
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        // Format output
        let duration = '';
        if (years > 0) {
            duration += years + (years === 1 ? ' yr' : ' yrs');
        }
        if (remainingMonths > 0) {
            if (duration) duration += ' ';
            duration += remainingMonths + (remainingMonths === 1 ? ' mo' : ' mos');
        }
        
        return duration || '0 mos';
    }
    
    function parseDate(dateStr) {
        // Parse dates like "Feb 2020", "May 2022", etc.
        const months = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const parts = dateStr.trim().split(' ');
        if (parts.length !== 2) return null;
        
        const monthStr = parts[0].toLowerCase().substring(0, 3);
        const year = parseInt(parts[1]);
        
        if (months[monthStr] === undefined || isNaN(year)) return null;
        
        return new Date(year, months[monthStr], 1);
    }
    
    // Update all durations on page load
    document.querySelectorAll('.date-range').forEach(dateRangeEl => {
        // date-range sits inside .date-wrapper, sibling to .role-name inside the label.
        // Use closest to find the label ancestor and then query .role-name inside it.
        const labelEl = dateRangeEl.closest('label');
        const roleNameEl = labelEl ? labelEl.querySelector('.role-name') : null;
        const durationEl = roleNameEl ? roleNameEl.querySelector('.duration') : null;
        if (durationEl) {
            const duration = calculateDuration(dateRangeEl.textContent);
            if (duration) durationEl.textContent = duration;
        }
    });

});