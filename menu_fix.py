import re
f=open('app.js','r',encoding='utf-8')
c=f.read()
f.close()
orig=len(c)

# Fix 1: Remove flashing "PRESS ANY KEY / TAP" text that overlaps menu
old1 = '  // Flashing start text\n  if(Math.floor(gameTime/30)%2===0){\n    ctx.fillStyle="#ff0";ctx.font="bold 10px monospace";\n    ctx.fillText("PRESS ANY KEY / TAP",W/2,200);\n  }'
new1 = '  // Navigation hint\n  ctx.fillStyle="#888";ctx.font="8px monospace";\n  ctx.fillText("Scroll to navigate, Enter to select",W/2,195);'
if old1 in c:
    c = c.replace(old1, new1)
    print("Fix1: OK - removed PRESS ANY KEY")
else:
    print("Fix1: SKIP - pattern not found")

# Fix 2: Remove catch-all that starts game on ANY key from title
old2 = 'if(gameState==="title"){startGame();return;}'
if old2 in c:
    c = c.replace(old2, '/* menu handles title keys */')
    print("Fix2: OK - removed catch-all startGame")
else:
    print("Fix2: SKIP - pattern not found")

# Fix 3: Add wheel handler for menu cycling on title screen
old3 = '} else if(gameState==="title"&&settingsOpen){'
new3 = '} else if(gameState==="title"&&!settingsOpen){\n      menuSelection=(menuSelection+(e.deltaY>0?1:-1)+3)%3;\n    } else if(gameState==="title"&&settingsOpen){'
if old3 in c:
    c = c.replace(old3, new3)
    print("Fix3: OK - added wheel menu cycling")
else:
    print("Fix3: SKIP - pattern not found")

# Fix 4: Also remove touch directly starting game - make touch respect menu
old4 = 'if(gameState==="title")startGame();'
if old4 in c:
    c = c.replace(old4, 'if(gameState==="title"){if(menuSelection===0)startGame();else if(menuSelection===1)gameState="settings";else if(menuSelection===2)gameState="skins";}')
    print("Fix4: OK - touch now respects menu selection")
else:
    print("Fix4: SKIP - pattern not found (may already be fixed)")

f=open('app.js','w',encoding='utf-8')
f.write(c)
f.close()
print("Size:", orig, "->", len(c))
print("PRESS ANY KEY still present:", "PRESS ANY KEY" in c)
print("catch-all startGame still present:", old2 in c)
print("wheel menu cycling present:", "!settingsOpen" in c)
