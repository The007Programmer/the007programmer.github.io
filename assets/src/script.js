    // Loading Animation
    window.addEventListener('load', () => {
        const loadingOverlay = document.querySelector('.loading-overlay');
        const loadingProgress = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-text');
        
        // Add loading class to body to prevent scrolling
        document.body.classList.add('loading');
        
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
              loadingOverlay.style.opacity = '0';
              setTimeout(() => {
                loadingOverlay.style.display = 'none';
                // Remove loading class to allow scrolling
                document.body.classList.remove('loading');
              }, 500);
            }, 500);
          }
          loadingProgress.style.width = `${progress}%`;
        }, 100);
      });
  
      // Custom Cursor
      const cursor = document.querySelector('.cursor');
      const follower = document.querySelector('.cursor-follower');
      document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        setTimeout(() => {
          follower.style.left = e.clientX + 'px';
          follower.style.top = e.clientY + 'px';
        }, 50);
      });
      window.addEventListener('focus', () => {
        const mouseX = window.mouseX || 0;
        const mouseY = window.mouseY || 0;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
        follower.style.left = mouseX + 'px';
        follower.style.top = mouseY + 'px';
      });
      document.addEventListener('mousemove', (e) => {
        window.mouseX = e.clientX;
        window.mouseY = e.clientY;
      });
      document.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(0.8)';
        follower.style.transform = 'scale(1.2)';
      });
      document.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1)';
        follower.style.transform = 'scale(1)';
      });
      const backgroundShapes = document.querySelector('.background-shapes');
      for (let i = 0; i < 3; i++) {
        const shape = document.createElement('div');
        shape.classList.add('shape');
        shape.style.width = Math.random() * 150 + 100 + 'px';
        shape.style.height = shape.style.width;
        shape.style.left = (i * 40) + Math.random() * 20 + '%';
        shape.style.top = Math.random() * 80 + 10 + '%';
        shape.style.animationDelay = Math.random() * 5 + 's';
        backgroundShapes.appendChild(shape);
      }
      document.addEventListener('mousemove', (e) => {
        const shapes = document.querySelectorAll('.floating-shape');
        const title = document.querySelector('.landing-title');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        shapes.forEach((shape, index) => {
          const speed = (index + 1) * 0.05;
          const x = (mouseX * 50 * speed);
          const y = (mouseY * 50 * speed);
          shape.style.transform = `translate(${x}px, ${y}px) rotate(${x/4}deg)`;
        });
        title.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
      });
      document.addEventListener('mousemove', (e) => {
        const title = document.querySelector('.hero-title');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        title.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
      });
      const titles = ["Computer Engineer", "Amateur Software Developer", "Linux Enthusiast"];
      let titleIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      const typingSpeed = 100;
      const deleteSpeed = 50;
      const waitBetweenWords = 2000;
      function typeEffect() {
        const subtitle = document.querySelector('.landing-subtitle');
        const currentTitle = titles[titleIndex];
        if (isDeleting) {
          subtitle.textContent = currentTitle.substring(0, charIndex - 1);
          charIndex--;
        } else {
          subtitle.textContent = currentTitle.substring(0, charIndex + 1);
          charIndex++;
        }
        if (!isDeleting && charIndex === currentTitle.length) {
          isDeleting = true;
          setTimeout(() => typeEffect(), waitBetweenWords);
          return;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          titleIndex = (titleIndex + 1) % titles.length;
          setTimeout(() => typeEffect(), typingSpeed);
          return;
        }
        const speed = isDeleting ? deleteSpeed : typingSpeed;
        setTimeout(() => typeEffect(), speed);
      }
      window.addEventListener('load', typeEffect);
      const observerOptions = { threshold: 0.25 };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); }
        });
      }, observerOptions);
      document.querySelectorAll('.about-text').forEach(el => observer.observe(el));
      document.querySelectorAll('.skill-category').forEach(el => observer.observe(el));
      document.querySelectorAll('.project-card').forEach(el => observer.observe(el));
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
      });
      window.addEventListener('scroll', () => {
        const nav = document.querySelector('.nav');
        if (window.scrollY > 100) {
          nav.style.padding = '1rem 4rem';
          nav.style.background = 'rgba(7, 30, 34, 0.95)';
        } else {
          nav.style.padding = '2rem 4rem';
          nav.style.background = 'rgba(7, 30, 34, 0.8)';
        }
      });
      const projectsGrid = document.querySelector('.projects-grid');
      const prevButton = document.querySelector('.scroll-button.prev');
      const nextButton = document.querySelector('.scroll-button.next');
      const scrollDots = document.querySelectorAll('.scroll-dot');
      const projectCards = document.querySelectorAll('.project-card');
      let currentIndex = 0;
      function scrollProjects(direction) {
        currentIndex = Math.max(0, Math.min(currentIndex + direction, projectCards.length - 1));
        const scrollPosition = projectCards[currentIndex].offsetLeft - projectsGrid.offsetLeft;
        projectsGrid.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        updateScrollDots();
      }
      function updateScrollDots() {
        scrollDots.forEach((dot, index) => { dot.classList.toggle('active', index === currentIndex); });
      }
      prevButton.addEventListener('click', () => scrollProjects(-1));
      nextButton.addEventListener('click', () => scrollProjects(1));
      scrollDots.forEach((dot, index) => {
        dot.addEventListener('click', () => { const direction = index - currentIndex; scrollProjects(direction); });
      });
      projectsGrid.addEventListener('scroll', () => {
        const scrollPosition = projectsGrid.scrollLeft;
        const cardWidth = projectCards[0].offsetWidth + 32;
        currentIndex = Math.round(scrollPosition / cardWidth);
        updateScrollDots();
      });
      projectCards[0].classList.add('visible');
      document.querySelectorAll('.timeline-item').forEach(el => observer.observe(el));
  
      // Timeline Scroll Text Fade Out
      const timelineScrollText = document.querySelector('.timeline-scroll-text');
      const timelineContainer = document.querySelector('.timeline-container');
      
      timelineContainer.addEventListener('scroll', () => {
        if (timelineContainer.scrollTop > 50) {
          timelineScrollText.classList.add('hidden');
        } else {
          timelineScrollText.classList.remove('hidden');
        }
      });