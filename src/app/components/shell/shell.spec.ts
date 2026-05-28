import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiServices } from '../../services/api-services';
import { ShellComponent } from './shell';

describe('ShellComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ShellComponent, RouterTestingModule],
            providers: [
                {
                    provide: ApiServices,
                    useValue: jasmine.createSpyObj<ApiServices>('ApiServices', ['isAdmin', 'logout'])
                }
            ]
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ShellComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
