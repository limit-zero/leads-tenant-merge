const db = require('../db');


module.exports = async () => {
  const projection = { name: 1 };

  const [ienTags, ddtTags] = await Promise.all([
    db.collection('ien', 'tags').find({ deleted: { $ne: true } }, { projection }).toArray(),
    db.collection('ddt', 'tags').find({ deleted: { $ne: true } }, { projection }).toArray(),
  ]);

  console.log(ienTags);
  console.log(ddtTags);
};
