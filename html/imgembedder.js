var showEmbeddedImage = (function() {
	var shieldBg ='rgba(0,0,0,0.5)',
		imgBorder = '1px #383838 solid',
		imgDefaultBg = '#444',
		imgWrapperBg ='rgba(255,255,255,0.1)',
		imgDefaultPadding = 0;
	
	function showImage(url, w, h, bg, p, sa) {
		if (!document.addEventListener) return true;
		var st,
			shield=document.createElement('div'),
			wrapper=document.createElement('div'),
			img=document.createElement('img'),
			imgpadding=(p)? parseInt(p):imgDefaultPadding,
			imgbg = (bg)? bg:imgDefaultBg,
			shieldbg = (sa)? 'rgba(0,0,0,'+sa+')':shieldBg,
			imgwrapperbg = (sa)? shieldbg:imgWrapperBg,
			ww, wh;
		img.src=url;
		if (w && h) {
			img.width=w;
			img.height=h;
			img.style.width=w+'px';
			img.style.maxWidth='100%';
			img.style.height='auto';
		}
		else {
			if (img.complete) {
				w=img.width;
				h=img.height;
			}
			else {
				img.onload=function() {
					var st=wrapper.style,
						w=img.width,
						h=img.height,
						ww=w+imgpadding*2,
						wh=h+imgpadding*2;
					st.margin=Math.floor((window.innerHeight-wh)/2)+'px auto 0 auto';
					st.width=ww+'px';
					st.height=wh+'px';
					img.style.width=w+'px';
					img.style.height=h+'px';
					img.onload=null;
				}
			}
		}
		shield.id='_img_shield';
		wrapper.id='_img_wrapper';
		st=shield.style;
		if (navigator.userAgent.match(/mobile/i)) {
			st.position='absolute';
			st.width='100%';
			st.height='100%';
			st.left=0;
			st.top=(
				(typeof window.scrollY !== 'undefined')? window.scrollY:
				(typeof window.pageYOffset !== 'undefined')? window.pageYOffset:
				(document.body && typeof document.body.scrollTop !== 'undefined')? document.body.scrollTop:
				0
			)+'px';
		}
		else {
			st.position='fixed';
			st.top=st.left=st.bottom=st.right=0;
		}
		st.backgroundColor=shieldbg;
		st.padding=st.margin=0;
		st.zIndex='99999';
		ww=w+imgpadding*2;
		wh=h+imgpadding*2;
		st=wrapper.style;
		st.position='relative';
		st.display='block';
		st.width=ww+'px';
		st.height=wh+'px';
		st.margin=Math.floor((window.innerHeight-wh)/2)+'px auto 0 auto';
		st.padding='2px';
		st.border=imgBorder;
		st.borderRadius=st.webkitBorderRadius=st.mozBorderRadius='2px';
		st.backgroundColor=imgwrapperbg;
		st=img.style;
		st.backgroundColor=imgbg;
		st.margin=0;
		st.padding=imgpadding+'px';
		st.width=w+'px';
		st.height=h+'px';
		shield.appendChild(wrapper);
		wrapper.appendChild(img);
		document.getElementsByTagName('body')[0].appendChild(shield);
		shield.addEventListener('click', hideImage, false);
		wrapper.addEventListener('click', stopEvent, false);
		return false;
	}
	
	function hideImage() {
		var el=document.getElementById('_img_shield');
		if (el && el.parentNode) {
			try {
				el.removeEventListener('click', hideImage);
				var el2=document.getElementById('_img_wrapper');
				el2.removeEventListener('click', stopEvent);
			}
			catch(e) {}
			el.parentNode.removeChild(el);
		}
	}
	
	function stopEvent(event) {
		if (event.preventDefault) event.preventDefault();
		if (event.stopPropagation) event.stopPropagation();
		if (event.preventManipulation) event.preventManipulation();
		if (event.preventMouseEvent) event.preventMouseEvent();
		event.cancelBubble=true;
		event.returnValue=false;
	}
	
	return showImage;
})();