const miniget = require("miniget");
const cheerio = require('cheerio');


const BASE_URL = 'https://dictionary.cambridge.org';
const headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36"}
const CLASS = {
    page: '.page',
    pr_dictionary: '.pr.dictionary',
    di_head_title: '.di-head .di-title',
    di_body_entry_body: '.di-body .entry .entry-body',
    entry_body_el: '.entry-body__el',
    pos_header: '.pos-header.dpos-h',
    pos_header_title: '.di-title',
    pos_header_grammar: '.pos.dpos', // exclamation, noun, verb, ...
    pos_header_pronounce: {
        us: {
            section: '.us.dpron-i',
            text: '.pron.dpron',
            media: '.us.dpron-i source'
        },
        uk: {
            section: '.uk.dpron-i',
            text: '.pron.dpron',
            media: '.uk.dpron-i source'
        }
    },
    pos_header_infl: '.irreg-infls.dinfls',
    pos_header_info: '.var.dvar',
    pos_body: '.pos-body,.pv-body', // 1 pos-body = pr dsense + pr dsense + pr dsense ...
    pr_dsense: '.pr.dsense', // pr dsense = dsense_h + dsense_b
    dsense_h: '.dsense_h',
    dsense_b: '.dsense_b',
    phrase_block: '.phrase-block.dphrase-block',
    phrase_head: '.phrase-head.dphrase_h',
    phrase_head_title: '.phrase-title.dphrase-title',
    phrase_body: '.phrase-body.dphrase_b',
    phrase_body_info: '.phrase-info.dphrase-info',
    def_block: '.def-block.ddef_block',
    def_block_head: '.ddef_h',
    def_block_head_info: '.def-info.ddef-info',
    def_block_head_title: '.def.ddef_d.db',
    def_block_body: '.def-body.ddef_b',
    def_block_body_ex: '.examp.dexamp',
};

get = async (search) => {
    if(!search) return [];
    try {
        const URL = `${BASE_URL}/dictionary/english/${search.replace(/\s/g, '-')}`;
        
        const html = await miniget(URL, {headers: headers, maxRedirects: 3}).text();
        
        const $ = cheerio.load(html);
        const page = $(CLASS.page).first();
        const words = [];

        for (let pr_dictionary of page.find(CLASS.pr_dictionary)) {
            pr_dictionary = $(pr_dictionary);

            const di_head_title = pr_dictionary.find(CLASS.di_head_title).first();
            const entry_body = pr_dictionary.find(CLASS.di_body_entry_body).first();

            const category = clear(di_head_title.text());

            for (let entry_body_el of entry_body.find(CLASS.entry_body_el)) {
                entry_body_el = $(entry_body_el);
                
                const word = { category: category, ...extractPosHeader($, entry_body_el), contents: []};

                const pos_body = entry_body_el.find(CLASS.pos_body).first();

                for (let pr_dsense of pos_body.find(CLASS.pr_dsense)) {
                    pr_dsense = $(pr_dsense);

                    const dsense_h = pr_dsense.find(CLASS.dsense_h).first();
                    const dsense_b = pr_dsense.find(CLASS.dsense_b).first();

                    word.contents.push({
                        guideword:clear(dsense_h.text()),
                        phrases: extractPhraseBlock($, dsense_b),
                        meanings: extractDefBlock($, dsense_b)
                    })
                }
                words.push(word);
            }
        }
        return words;
    } catch (e) {
        console.log(`Get word = ${search} error: ${e}`);
        return [];
    }
}

const extractPosHeader = ($, entry_body_el) => {
    const pos_header = entry_body_el.find(CLASS.pos_header).first();

    const title = pos_header.find(CLASS.pos_header_title).first().text() || entry_body_el.find(CLASS.pos_header_title).first().text();
    const grammar = pos_header.find(CLASS.pos_header_grammar).first().text();
    const infl = pos_header.find(CLASS.pos_header_infl).first().text();
    const info = pos_header.find(CLASS.pos_header_info).first().text();

    const pronounce = { us: {}, uk: {} }
    for (const lang in pronounce) {
        const block = pos_header.find(CLASS.pos_header_pronounce[lang].section).first();
        const text = block.find(CLASS.pos_header_pronounce[lang].text).first().text();
        const media = block.find(CLASS.pos_header_pronounce[lang].media).first().attr('src');

        pronounce[lang] = {
            text: clear(text),
            media: clear(media)
        }
    }

    return {
        title: clear(title),
        grammar: clear(grammar),
        pronounce: pronounce,
        infl: clear(infl),
        info: clear(info)
    }
}
const extractPhraseBlock = ($, dsense_b) => {
    const phrases = [];
    for (let phrase_block of dsense_b.children(CLASS.phrase_block)) {
        phrase_block = $(phrase_block);

        const phrase_head = phrase_block.find(CLASS.phrase_head).first();
        const phrase_body = phrase_block.find(CLASS.phrase_body).first();

        const title = clear(phrase_head.find(CLASS.phrase_head_title).first().text());
        const meanings = extractDefBlock($, phrase_body);

        phrases.push({title, meanings});
    }
    return phrases;
}

const extractDefBlock = ($, dsense_b) => {
    const meanings = [];
    for (let def_block of dsense_b.children(CLASS.def_block)) {
        def_block = $(def_block);

        const def_block_head = def_block.find(CLASS.def_block_head).first();
        const def_block_body = def_block.find(CLASS.def_block_body).first();

        const info = clear(def_block_head.find(CLASS.def_block_head_info).first().text());
        const meaning = clear(def_block_head.find(CLASS.def_block_head_title).first().text()); 
        const examples = [];
        for (let examp of def_block_body.find(CLASS.def_block_body_ex)) {
            examples.push(clear($(examp).text()))
        }
        meanings.push({info, meaning, examples});
    }
    return meanings;
}

const clear = (text) => {
    if (!text) return '';
    return text.replace(/\s+|Your browser doesn't support HTML5 audio/gi, " ").trim();
}

module.exports = {get}
