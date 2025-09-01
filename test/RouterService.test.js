import { RouterService } from './RouterService.js';

describe('RouterService', () => {
    let router;
    const routes = [
        { path: '/', component: 'home-view' },
        { path: '/about', component: 'about-view' },
        { path: '/user/:id', component: 'user-view' },
        { path: '/posts/:year/:month', component: 'posts-view' }
    ];

    beforeEach(() => {
        window.location.hash = '';
        router = new RouterService(routes);
    });

    test('should initialize with the correct route', () => {
        window.location.hash = '#/about';
        router.init();
        expect(router.getCurrentRoute().path).toBe('/about');
    });

    test('should handle route changes', (done) => {
        router.init();
        router.addEventListener('routeChanged', (event) => {
            expect(event.detail.path).toBe('/about');
            done();
        });
        window.location.hash = '#/about';
    });

    test('should extract route parameters', () => {
        window.location.hash = '#/user/123';
        router.init();
        const currentRoute = router.getCurrentRoute();
        expect(currentRoute.params.id).toBe('123');
    });

    test('should extract multiple route parameters', () => {
        window.location.hash = '#/posts/2025/08';
        router.init();
        const currentRoute = router.getCurrentRoute();
        expect(currentRoute.params.year).toBe('2025');
        expect(currentRoute.params.month).toBe('08');
    });

    test('should handle query parameters', () => {
        window.location.hash = '#/about?q=test&sort=asc';
        router.init();
        const currentRoute = router.getCurrentRoute();
        expect(currentRoute.query.q).toBe('test');
        expect(currentRoute.query.sort).toBe('asc');
    });

    test('should emit routeNotFound for unknown routes', (done) => {
        router.init();
        router.addEventListener('routeNotFound', (event) => {
            expect(event.detail.path).toBe('/unknown');
            done();
        });
        window.location.hash = '#/unknown';
    });

    test('should navigate to a new route', (done) => {
        router.init();
        router.addEventListener('routeChanged', (event) => {
            expect(event.detail.path).toBe('/about');
            done();
        });
        router.navigate('/about');
    });

    test('should add a new route', (done) => {
        router.init();
        router.addRoute('/new', 'new-view');
        router.addEventListener('routeChanged', (event) => {
            expect(event.detail.path).toBe('/new');
            done();
        });
        router.navigate('/new');
    });
});
