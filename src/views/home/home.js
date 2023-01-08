let timer;
const api = {
    search: '/api/dictionary/cambridge?search=',
    bulk_search: '/api/dictionary/cambridge',
    suggest: '/api/dictionary/suggest?search=',
    saved_word: '/api/word/saved',
    headers: { 'Content-Type': 'application/json' },
    get: "GET",
    post: "POST",
    delete: "DELETE"
};
const history = JSON.parse(window.localStorage.getItem('histories') || "[]");

const toolbar = new Vue({
    el: "#toolbar",
    data: {},
    methods: {
        refresh: function () {
            group_field.refresh();
        }
    }
});

const save_field = new Vue({
    el: "#save-field",
    data: {
        title: '',
        group: '',
        note: '',
        status: 'success',
        added: true,
        display: true,
    },
    methods: {
        save: function () {
            this.status = "loading";
            const self = this;
            group_field.save(this.title, this.group, this.added, this.note).then(
                result => {
                    if (result.status) {
                        self.status = 'success';
                        dictionary.save(this.title);
                    } else self.status = 'fail'
                }
            )
        },
        remove: function () {
            save_field.status = "loading";
            group_field.remove([save_field.title], '').then(
                result => {
                    if (result.status) {
                        save_field.status = "success";
                        save_field.group = '';
                        save_field.note = '';
                    } else save_field.status = 'fail';
                }
            )
        },
        reload: function (title, word, added) {
            this.title = title;
            this.group = word ? word.group : '';
            this.note = word ? word.note : '';
            this.added = (word && word.added) || added;
            this.status = 'success';
        }
    },
    computed: {
        save_status: function () {
            if (this.status === "success") return "fa fa-check pos";
            else if (this.status === "fail") return "fa fa-close neg";
            else if (this.status === "loading") return "fa fa-refresh fa-spin nor";
        }
    }
});

const quiz = new Vue({
    el: "#quiz",
    data: {
        loading: false,
        display: false,
        ready: false,
        type: '',
        message: '',
        questions: [],
        current_question: false,
    },
    methods: {
        newGame: function (words, type) {
            this.display = true;
            this.ready = false;
            this.current_question = false,
            this.questions = [];
            this.type = type;

            if (words.length < 6) {
                this.message = 'You must have at least 6 words to start leanring!';
                return;
            }

            this.loading = true;

            const bulk_search = [];
            const user_added = [];
            for (const word of words) {
                if (group_field.saved_words[word].added) user_added.push(group_field.saved_words[word]);
                else bulk_search.push(word);
            }

            dictionary.bulk_search(words).then(result => {
                quiz.message = `Get total ${words.length} words: success (${words.length - result.fail.length}),\n fail (${result.fail.length})${result.fail.length ? ` = ${result.fail}` : ''}`

                for (const group of result.data) {
                    for (const word of group) {
                        for (const content of word.contents) {
                            for (const meaning of content.meanings) {
                                quiz.questions.push({
                                    title: word.title,
                                    grammar: word.grammar,
                                    meaning: meaning.meaning,
                                    us: {
                                        media: word.pronounce.us.media,
                                        text: word.pronounce.us.text
                                    },
                                    uk: {
                                        media: word.pronounce.uk.media,
                                        text: word.pronounce.uk.text
                                    },
                                    examples: meaning.examples,
                                    note: group_field.saved_words[word.title].note,
                                });
                            }
                            for (const phrase of content.phrases) {
                                for (const meaning of phrase.meanings) {
                                    const note = group_field.saved_words[phrase.title] ?
                                        group_field.saved_words[phrase.title].note : '';
                                    quiz.questions.push({
                                        title: phrase.title,
                                        grammar: 'phrase',
                                        meaning: meaning.meaning,
                                        us: { media: '', text: '' },
                                        uk: { media: '', text: '' },
                                        examples: meaning.examples,
                                        note: note
                                    });
                                }
                            }
                        }
                    }
                }

                for (const word of user_added) {
                    quiz.questions.push({
                        title: word.title,
                        grammar: 'phrase',
                        meaning: word.note,
                        us: { media: '', text: '' },
                        uk: { media: '', text: '' },
                        examples: [],
                        note: note
                    });
                }
                quiz.questions = shuffle(quiz.questions);
                quiz.loading = false;
                quiz.ready = true;
            });
        },
        start: function () {
            if (!this.ready) return;
            this.next(0);
        },
        close: function () {  
            if(confirm('Stop leanring ?')) {
                this.display = false;
                group_field.display = true;
                save_field.display = true;
            }
        },
        next: function (index=0) {
            const min = 0;
            const max = this.questions.length - 1;

            if (index > max || max < 6) {
                this.current_question = false;
                return;
            }

            const correct_ans = this.questions[index];
            const total_ans = [];

            const correct_i = random(0, 5);
            let correct_max = 1;
            for (let i = 0; i < 6; i++) {
                if(i == correct_i) total_ans[i] = { 
                    title: correct_ans.title,
                    grammar: correct_ans.grammar,
                    meaning: correct_ans.meaning, 
                    status: '' 
                }; else {
                    const ranQues = this.questions[random(min, max, index)];
                    if(ranQues.title == correct_ans.title) correct_max += 1;
                    total_ans[i] = {
                        title: ranQues.title,
                        grammar: ranQues.grammar,
                        meaning: ranQues.meaning, 
                        status: ''
                    };
                }
                    
            }
            setTimeout(function () {
                for (const audio of document.getElementsByTagName('audio')) audio.load();
                if (correct_ans.us.media) playAudio(document.getElementById('pron-us'));
                else if (correct_ans.uk.media) playAudio(document.getElementById('pron-uk'));
                document.getElementById('title').focus();
            }, 25)
            this.current_question = {
                index: index,
                correct_ans: correct_ans,
                correct_count: 0,
                correct_max: correct_max,
                user_input: '',
                total_ans: total_ans,
                hasAudio: !!(correct_ans.us.media || correct_ans.uk.media),
                hasProunce: !!(correct_ans.us.text || correct_ans.uk.text)
            }
        },
        checkAnswer: function (ans) {
            if(ans.status) return;
            if(ans.title == this.current_question.correct_ans.title) {
                ans.status = "success";
                this.current_question.correct_count += 1;
            } else ans.status = "fail"
        }
    },
    computed: {
        checkUserInput: function () {
            return (this.current_question.correct_ans.title.toLowerCase() == this.current_question.user_input.toLowerCase());
        },
        checkDone: function () {
            console.log('check done');
            if(!this.checkUserInput) return false;
            else if(this.current_question.correct_count != this.current_question.correct_max) return false;
            if (this.current_question.correct_ans.us.media) playAudio(document.getElementById('pron-us'));
            else if (this.current_question.correct_ans.uk.media) playAudio(document.getElementById('pron-uk'));
            return true;
        }
    }
})

const group_field = new Vue({
    el: '#group-field',
    data: {
        loading: true,
        groups: {},
        saved_words: {},
        current_group: '',
        checked: [],
        display: true
    },
    methods: {
        refresh: async function () {
            this.loading = true;
            fetch(api.saved_word, {
                method: api.get,
                headers: api.headers,
            }).then(response => response.json()).then(result => {
                const words = {};
                const groups = { 'all': 0 }
                if (result.status) {
                    for (const word of result.data) {
                        words[word.title] = { loading: false, ...word };
                        groups[word.group] = groups[word.group] ? groups[word.group] + 1 : 1;
                        groups.all += 1;
                    }
                }
                group_field.groups = groups;
                group_field.saved_words = words;
                this.loading = false;
            }).catch(error => {
                console.log(`Get saved words error: ${error}`);
                this.loading = false;
            });
        },
        save: async function (title, group, isAdded, note) {
            return await fetch(api.saved_word, {
                method: api.post,
                headers: api.headers,
                body: JSON.stringify({
                    title: title,
                    group: group,
                    added: isAdded,
                    note: note
                })
            }).then(response => response.json()).then(result => {
                console.log(`Save word = ${title}: ${JSON.stringify(result)}`);
                if (result.status && result.data.word) {
                    if (group_field.saved_words[title]) {
                        const oldGroup = group_field.saved_words[title].group;
                        group_field.groups[oldGroup] -= 1;
                        group_field.groups.all -= 1;
                        if (!group_field.groups[oldGroup]) delete group_field.groups[oldGroup];
                    }

                    const word = result.data.word;
                    group_field.groups.all += 1;
                    group_field.groups[word.group] = group_field.groups[word.group] ? group_field.groups[word.group] + 1 : 1;

                    group_field.saved_words[word.title] = word;

                    group_field.saved_words = { ...group_field.saved_words };
                }
                return result;
            }).catch(error => {
                console.log(`Save word = ${title}: ${error}`);
                return { status: false }
            });
        },
        remove: async function (titles, group) {
            return await fetch(api.saved_word, {
                method: api.delete,
                headers: api.headers,
                body: JSON.stringify({
                    titles: titles,
                    group: group
                })
            }).then(response => response.json()).then(result => {
                console.log(`Remove word = ${titles}: ${JSON.stringify(result)}`);
                if (result.status) {
                    const deleted = {};
                    for (const title of titles) {
                        deleted[title] = true;
                        if (group_field.saved_words[title]) {
                            const oldGroup = group_field.saved_words[title].group;
                            group_field.groups.all -= 1;
                            group_field.groups[oldGroup] -= 1;
                            if (!group_field.groups[oldGroup]) delete group_field.groups[oldGroup];
                        }
                        delete group_field.saved_words[title];
                    }
                    group_field.checked = group_field.checked.filter(word => !deleted[word]);
                    group_field.saved_words = { ...group_field.saved_words };
                }

                return result;
            }).catch(error => {
                console.log(`Remove word = ${titles} error: ${error}`);
                return { status: false }
            });
        },
        search: function (word) {
            save_field.reload(word.title, word, word.added);
            if (!word.added) dictionary.search(word.title);
        },
        toggleAll: function () {
            const group = this.current_words;
            let check = false;

            for (const word of this.checked) if (group[word]) {
                check = true;
                break;
            }

            if (!check) this.checked = [...this.checked, ...Object.keys(this.current_words)];
            else this.checked = this.checked.filter(w => !group[w]);
        },
        reload: function (group) {
            if (!save_field.group && group != 'all') save_field.group = group;
            group_field.current_group = group;
        },
        unCheck: function (word) {
            const index = this.checked.indexOf(word);
            if (index > -1) this.checked.splice(index, 1);
        },
        newGame: function (type) {
            this.display = false;
            save_field.display = false;
            quiz.newGame(this.checked, type);
        }
    },
    computed: {
        current_words: function () {
            if (this.current_group === "all") return this.saved_words;

            const words = {};
            for (const word of Object.values(this.saved_words)) {
                if (word.group == this.current_group) words[word.title] = word;
            }

            return words;
        }
    }
})
group_field.refresh();

const dictionary = new Vue({
    el: '#dictionary',
    data: {
        loading: true,
        words: [],
        suggestions: history,
        message: '',
        word: '',
        saved: false
    },
    methods: {
        search: function (word) {
            if (word) dictionary.word = word;
            dictionary.loading = true;
            if (!dictionary.word) dictionary.reload([], 'Search something :)))');
            else fetch(api.search + dictionary.word, {
                method: api.get,
                headers: api.headers,
            }).then(response => response.json()).then(result => {
                if (!result.status) dictionary.reload([], result.message);
                else dictionary.reload(result.data, '');
            }).catch(error => {
                console.log(`Search for word = ${word} error: ${error}`);
                dictionary.reload([], error.toString());
            });
        },
        bulk_search: async function (words) {
            return await fetch(api.bulk_search, {
                method: api.post,
                headers: api.headers,
                body: JSON.stringify({ words: words })
            }).then(response => response.json()).then(result => result)
                .catch(error => {
                    console.log(`Bulk Search for word = ${words} error: ${error.toString()}`);
                    return { status: false, data: [], fail: words };
                });
        },
        suggest: function () {
            if (!dictionary.word) {
                dictionary.suggestions = history;
                return;
            }
            fetch(api.suggest + dictionary.word, {
                method: api.get,
                headers: api.headers,
            }).then(response => response.json()).then(result => {
                dictionary.suggestions = [];
                for (const data of result) if (!data.beta) dictionary.suggestions.push(data.word);
            }).catch(error => {
                console.log(`Get suggestions error: ${error}`);
                dictionary.suggestions = [];
            });
        },
        reload: function (words, message) {
            if (words.length) {
                const title = words[0].title;
                dictionary.word = title;
                saveHistory(title);
            }

            const word = group_field.saved_words[dictionary.word];
            dictionary.saved = !!word;
            save_field.reload(dictionary.word, word, !words.length);

            dictionary.words = words;
            dictionary.message = message;
            for (const audio of document.getElementsByTagName('audio')) audio.load();
            setTimeout( () => playAudio(document.getElementById('dictionary')), 25);
            dictionary.loading = false;
        },
        typing: function () {
            clearTimeout(timer);
            timer = setTimeout(dictionary.suggest, 100);
        },
        clear: function () {
            dictionary.word = '';
            dictionary.suggestions = history;
        },
        remove: function (title) {
            dictionary.saved = false;
            group_field.remove([title]).then(result => dictionary.saved = !result.status);
        },
        save: function (title) {
            if (this.words[0] && this.words[0].title == title) this.saved = true;
        }
    },
    computed: {
        total_words: function () {
            return this.words.filter(word => {
                for (const content of word.contents) {
                    if (content.meanings.length) return true;
                }
            });
        },
        total_phrases: function () {
            const phrases = {};
            for (const word of this.words) {
                const category = word.category || '';
                for (const content of word.contents) {
                    for (const phrase of content.phrases) {
                        if (!phrases[category]) phrases[category] = [];
                        phrases[category].push(phrase);
                    }
                }
            }
            return phrases;
        },
    }
});
dictionary.search();

const saveHistory = (word) => {
    if (!word) return;

    const index = history.indexOf(word);
    if (index !== -1) history.splice(index, 1);

    history.unshift(word);
    while (history.length > 9) history.pop();

    window.localStorage.setItem('histories', JSON.stringify(history));
}
document.getElementById("search-bar").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        document.getElementById("search-bar").blur();
        dictionary.search();
    }
    else dictionary.typing();
});
const playAudio = (tag) => {
    if (!tag) return;
    tag = tag.getElementsByTagName('audio');
    if (tag.length) tag[0].play();
}

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = random(0, i);
        // Swap arr[i] with the element at random index
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
    return array;
}
const random = (start, end, except) => {
    if (start == end) return start;
    while (true) {
        const ran = Math.floor(Math.random() * (end - start + 1) + start);
        if (ran !== except) return ran;
    }
}