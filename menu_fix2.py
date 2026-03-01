import re
f=open('app.js','r',encoding='utf-8')
c=f.read()
f.close()
orig=len(c)

# Fix 5: Make tap on title screen cycle menu instead of triggering action
old = 'if(gameState==="title"){if(menuSelection===0)startGame();else if(menuSelection===1)gameState="settings";else gameState="skins";}'
new = 'if(gameState==="title"){menuSelection=(menuSelection+1)%3;}'
if old in c:
    c = c.replace(old, new)
    print("Fix5: OK - tap now cycles menu instead of triggering action")
else:
    print("Fix5: SKIP - pattern not found")

f=open('app.js','w',encoding='utf-8')
f.write(c)
f.close()
print("Size:", orig, "->", len(c))
