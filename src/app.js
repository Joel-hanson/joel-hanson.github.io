import TypeWriter from './components/typewriter.js';
import InnerSection from './components/inner-section.js';

var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!'
    },
    components: {
        TypeWriter,
        InnerSection
    }
});

