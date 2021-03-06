/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { runTargetSpec } from '@angular-devkit/architect/testing';
import { join, normalize, virtualFs } from '@angular-devkit/core';
import { take, tap } from 'rxjs/operators';
import { BuildWebpackServerSchema } from '../../src/server/schema';
import { host } from '../utils';


describe('Server Builder', () => {
  const outputPath = normalize('dist-server');

  beforeEach(done => host.initialize().toPromise().then(done, done.fail));
  afterEach(done => host.restore().toPromise().then(done, done.fail));

  it('works (base)', (done) => {
    const overrides = { };

    runTargetSpec(host, { project: 'app', target: 'server' }, overrides).pipe(
      tap((buildEvent) => {
        expect(buildEvent.success).toBe(true);

        const fileName = join(outputPath, 'main.js');
        const content = virtualFs.fileBufferToString(host.scopedSync().read(normalize(fileName)));
        expect(content).toMatch(/AppServerModuleNgFactory/);
      }),
    ).toPromise().then(done, done.fail);
  });

  it('supports sourcemaps', (done) => {
    const overrides = { sourceMap: true };

    runTargetSpec(host, { project: 'app', target: 'server' }, overrides).pipe(
      tap((buildEvent) => {
        expect(buildEvent.success).toBe(true);

        const fileName = join(outputPath, 'main.js');
        const content = virtualFs.fileBufferToString(host.scopedSync().read(normalize(fileName)));
        expect(content).toMatch(/AppServerModuleNgFactory/);
        expect(host.scopedSync().exists(join(outputPath, 'main.js.map'))).toBeTruthy();
      }),
    ).toPromise().then(done, done.fail);
  });

  it('supports scripts only sourcemaps', (done) => {
    const overrides: Partial<BuildWebpackServerSchema> = {
      sourceMap: {
        styles: false,
        scripts: true,
      },
    };

    host.writeMultipleFiles({
      'src/app/app.component.css': `p { color: red; }`,
    });

    runTargetSpec(host, { project: 'app', target: 'server' }, overrides).pipe(
      tap((buildEvent) => expect(buildEvent.success).toBe(true)),
      tap(() => {
        expect(host.scopedSync().exists(join(outputPath, 'main.js.map'))).toBe(true);

        const scriptContent = virtualFs.fileBufferToString(
          host.scopedSync().read(join(outputPath, 'main.js')),
        );
        expect(scriptContent).toContain('sourceMappingURL=main.js.map');
        expect(scriptContent).not.toContain('sourceMappingURL=data:application/json');
      }),
    ).toPromise().then(done, done.fail);
  });

  it('supports component styles sourcemaps', (done) => {
    const overrides: Partial<BuildWebpackServerSchema> = {
      sourceMap: {
        styles: true,
        scripts: true,
      },
    };

    host.writeMultipleFiles({
      'src/app/app.component.css': `p { color: red; }`,
    });

    runTargetSpec(host, { project: 'app', target: 'server' }, overrides).pipe(
      tap((buildEvent) => expect(buildEvent.success).toBe(true)),
      tap(() => {
        expect(host.scopedSync().exists(join(outputPath, 'main.js.map'))).toBe(true);

        const scriptContent = virtualFs.fileBufferToString(
          host.scopedSync().read(join(outputPath, 'main.js')),
        );
        expect(scriptContent).toContain('sourceMappingURL=main.js.map');
        expect(scriptContent).toContain('sourceMappingURL=data:application/json');
      }),
    ).toPromise().then(done, done.fail);
  });

  it('runs watch mode', (done) => {
    const overrides = { watch: true };

    runTargetSpec(host, { project: 'app', target: 'server' }, overrides).pipe(
      tap((buildEvent) => {
        expect(buildEvent.success).toBe(true);

        const fileName = join(outputPath, 'main.js');
        const content = virtualFs.fileBufferToString(host.scopedSync().read(normalize(fileName)));
        expect(content).toMatch(/AppServerModuleNgFactory/);
      }),
      take(1),
    ).subscribe(undefined, done.fail, done);
  });
});
