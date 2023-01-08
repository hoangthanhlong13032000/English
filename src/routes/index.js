const cambridgeRouter = require('./cambridge');
const suggestRouter = require('./suggest');
const viewsRouter = require('./views')
const savedWordRouter = require('./saved_word')

route = (app) => {
  app.use('', viewsRouter);
  app.use('/api/dictionary/cambridge', cambridgeRouter);
  app.use('/api/dictionary/suggest', suggestRouter);
  app.use('/api/word/saved', savedWordRouter);
}

module.exports = route