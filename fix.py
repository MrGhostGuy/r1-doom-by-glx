import sys
q = '"'

with open('app.js', 'r') as f:
    content = f.read()
    lines = content.split('\n')

print(f'Read {len(lines)} lines')

# First, let's revert to the git version to ensure clean state
import subprocess
result = subprocess.run(['git', 'checkout', 'app.js'], capture_output=True, text=True)
print(f'Git checkout: {result.stdout.strip()} {result.stderr.strip()}')

with open('app.js', 'r') as f:
    content = f.read()
    lines = content.split('\n')
print(f'After git checkout: {len(lines)} lines')

# Now apply ALL fixes from scratch on the clean file

# === FIX 1: Add debug overlay to renderTitle ===
# Find 'gameTime++;' that comes after 'ctx.textAlign="left"' in renderTitle
# The renderTitle function ends around line 835-836 with these two lines
fix1_done = False
for i in range(len(lines)):
    if 'gameTime++' in lines[i] and i > 0 and 'textAlign' in lines[i-1]:
        # Check we're in renderTitle (look for DOOM title text nearby)
        context = '\n'.join(lines[max(0,i-30):i])
        if 'DOOM' in context or 'renderTitle' in context:
            # Insert debug overlay before gameTime++
            indent = '    '
            debug_lines = [
                indent + '// Debug overlay - show last input event for R1 diagnosis',
                indent + 'if(typeof lastInputDebug!==' + q + 'undefined' + q + '){',
                indent + '  ctx.fillStyle=' + q + '#0ff' + q + ';ctx.font=' + q + 'bold 7px monospace' + q + ';ctx.textAlign=' + q + 'center' + q + ';',
                indent + '  ctx.fillText(' + q + 'DBG: ' + q + '+lastInputDebug,W/2,H-4);ctx.textAlign=' + q + 'left' + q + ';',
                indent + '}',
            ]
            for j, dl in enumerate(debug_lines):
                lines.insert(i + j, dl)
            fix1_done = True
            print(f'Fix 1: Debug overlay inserted at line {i+1}')
            break
if not fix1_done:
    print('Fix 1: FAILED - pattern not found')

# === FIX 2: Add title-state touch handling in touchstart ===
# Find the touchstart non-play block and add title handling
fix2_done = False
for i in range(len(lines)):
    if 'gameState!==' + q + 'play' + q in lines[i] and i > 0 and 'preventDefault' in lines[i-1]:
        # This is the non-play block in touchstart
        # Insert title-state handling before it
        indent = '        '
        title_touch = [
            indent + '// R1 TITLE MENU - tap on items or tap top/bottom half to navigate',
            indent + 'if(gameState===' + q + 'title' + q + '){',
            indent + '  var tt=e.changedTouches?e.changedTouches[0]:e;',
            indent + '  var ty2=tt.clientY||0;',
            indent + '  lastInputDebug=' + q + 'touch y=' + q + '+Math.round(ty2);',
            indent + '  var scale=canvas.height/H;',
            indent + '  var playY=140*scale,settY=155*scale,skinY=170*scale;',
            indent + '  var margin=12*scale;',
            indent + '  if(Math.abs(ty2-playY)<margin){menuSelection=0;lastInputDebug=' + q + 'tap PLAY' + q + ';}',
            indent + '  else if(Math.abs(ty2-settY)<margin){menuSelection=1;lastInputDebug=' + q + 'tap SETTINGS' + q + ';}',
            indent + '  else if(Math.abs(ty2-skinY)<margin){menuSelection=2;lastInputDebug=' + q + 'tap SKINS' + q + ';}',
            indent + '  else if(ty2<canvas.height*0.4){menuSelection=(menuSelection+2)%3;lastInputDebug=' + q + 'tap up' + q + ';}',
            indent + '  else{menuSelection=(menuSelection+1)%3;lastInputDebug=' + q + 'tap down' + q + ';}',
            indent + '  return;',
            indent + '}',
        ]
        for j, tl in enumerate(title_touch):
            lines.insert(i + j, tl)
        fix2_done = True
        print(f'Fix 2: Title touch handling inserted at line {i+1}')
        break
if not fix2_done:
    print('Fix 2: FAILED - pattern not found')

# === FIX 3: Add comprehensive event listeners before loadLevel(1) ===
fix3_done = False
for i in range(len(lines)-1, -1, -1):
    if 'loadLevel(1)' in lines[i]:
        event_code = [
            '',
            '// === R1 COMPREHENSIVE INPUT CAPTURE ===',
            '// Capture ALL event types to diagnose what R1 hardware actually sends',
            'var r1EvtLog=[' + q + 'scroll' + q + ',' + q + 'pointerdown' + q + ',' + q + 'pointermove' + q + ',' + q + 'pointerup' + q + ',',
            '  ' + q + 'mousedown' + q + ',' + q + 'mouseup' + q + ',' + q + 'click' + q + ',' + q + 'dblclick' + q + ',' + q + 'contextmenu' + q + '];',
            'r1EvtLog.forEach(function(evtName){',
            '  document.addEventListener(evtName,function(e){',
            '    lastInputDebug=evtName+' + q + ' x=' + q + '+(e.clientX||0)+' + q + ' y=' + q + '+(e.clientY||0);',
            '    if(gameState===' + q + 'title' + q + '&&(evtName===' + q + 'click' + q + '||evtName===' + q + 'pointerdown' + q + '||evtName===' + q + 'mousedown' + q + ')){',
            '      var cy=e.clientY||0,scale=canvas.height/H;',
            '      var playY=140*scale,settY=155*scale,skinY=170*scale,margin=12*scale;',
            '      if(Math.abs(cy-playY)<margin){menuSelection=0;startGame();}',
            '      else if(Math.abs(cy-settY)<margin){menuSelection=1;gameState=' + q + 'settings' + q + ';}',
            '      else if(Math.abs(cy-skinY)<margin){menuSelection=2;gameState=' + q + 'skins' + q + ';}',
            '      else if(cy<canvas.height*0.4){menuSelection=(menuSelection+2)%3;}',
            '      else if(cy>canvas.height*0.6){menuSelection=(menuSelection+1)%3;}',
            '    }',
            '  },{passive:true});',
            '});',
            '',
            '// Document-level touch for R1 WebView (backup)',
            'document.addEventListener(' + q + 'touchstart' + q + ',function(e){',
            '  var t=e.changedTouches?e.changedTouches[0]:e;',
            '  lastInputDebug=' + q + 'doc-touch y=' + q + '+Math.round(t.clientY);',
            '  if(gameState===' + q + 'title' + q + '){',
            '    var cy=t.clientY,scale=canvas.height/H;',
            '    var playY=140*scale,settY=155*scale,skinY=170*scale,margin=12*scale;',
            '    if(Math.abs(cy-playY)<margin){menuSelection=0;}',
            '    else if(Math.abs(cy-settY)<margin){menuSelection=1;}',
            '    else if(Math.abs(cy-skinY)<margin){menuSelection=2;}',
            '    else if(cy<canvas.height*0.4){menuSelection=(menuSelection+2)%3;}',
            '    else{menuSelection=(menuSelection+1)%3;}',
            '  }',
            '},{passive:true});',
            '',
            '// Double-tap on title = confirm selection',
            'var titleLastTap=0;',
            'document.addEventListener(' + q + 'touchend' + q + ',function(e){',
            '  if(gameState===' + q + 'title' + q + '){',
            '    var now=Date.now();',
            '    if(now-titleLastTap<400){',
            '      lastInputDebug=' + q + 'dbl-tap sel=' + q + '+menuSelection;',
            '      if(menuSelection===0)startGame();',
            '      else if(menuSelection===1)gameState=' + q + 'settings' + q + ';',
            '      else gameState=' + q + 'skins' + q + ';',
            '    }',
            '    titleLastTap=now;',
            '  }',
            '},{passive:true});',
            '',
            '// Catch ALL keydown codes (R1 scroll wheel may send unusual keyCodes)',
            'document.addEventListener(' + q + 'keydown' + q + ',function(e){',
            '  lastInputDebug=' + q + 'KEY ' + q + '+e.key+' + q + ' c=' + q + '+e.code+' + q + ' kc=' + q + '+e.keyCode;',
            '  if(gameState===' + q + 'title' + q + '){',
            '    var k=e.key,kc=e.keyCode;',
            '    if(k===' + q + 'ArrowDown' + q + '||k===' + q + 'Down' + q + '||kc===40||kc===34||k===' + q + 'PageDown' + q + '||k===' + q + 'VolumeDown' + q + '){menuSelection=(menuSelection+1)%3;e.preventDefault();}',
            '    else if(k===' + q + 'ArrowUp' + q + '||k===' + q + 'Up' + q + '||kc===38||kc===33||k===' + q + 'PageUp' + q + '||k===' + q + 'VolumeUp' + q + '){menuSelection=(menuSelection+2)%3;e.preventDefault();}',
            '    else if(k===' + q + 'Enter' + q + '||k===' + q + 'F5' + q + '||k===' + q + 'F6' + q + '||k===' + q + ' ' + q + '||kc===13||kc===32){',
            '      if(menuSelection===0)startGame();',
            '      else if(menuSelection===1)gameState=' + q + 'settings' + q + ';',
            '      else gameState=' + q + 'skins' + q + ';',
            '      e.preventDefault();',
            '    }',
            '  }',
            '});',
            '',
        ]
        for j, el in enumerate(event_code):
            lines.insert(i + j, el)
        fix3_done = True
        print(f'Fix 3: Comprehensive event listeners inserted at line {i+1}')
        break
if not fix3_done:
    print('Fix 3: FAILED - loadLevel(1) not found')

# Write the modified file
with open('app.js', 'w', newline='\n') as f:
    f.write('\n'.join(lines))

print(f'Final file: {len(lines)} lines')
print('ALL FIXES APPLIED')
