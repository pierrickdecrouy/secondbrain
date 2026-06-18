import re

with open('src/storage.ts', 'r') as f:
    storage = f.read()

storage = storage.replace(
    'await db.cards.clear();\n        await db.cards.bulkAdd(cards);',
    'await db.transaction(\'rw\', db.cards, async () => {\n            await db.cards.clear();\n            await db.cards.bulkAdd(cards);\n        });'
)

with open('src/storage.ts', 'w') as f:
    f.write(storage)

