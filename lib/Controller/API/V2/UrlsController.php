<?php
/**
 * Created by PhpStorm.
 * User: fregini
 * Date: 09/09/16
 * Time: 15:11
 */

namespace API\V2;

use API\V2\Json\ProjectUrls;
use API\V2\Validators\ProjectPasswordValidator ;
use DataAccess\ShapelessConcreteStruct;

class UrlsController extends KleinController {

    /**
     * @var ProjectPasswordValidator
     */
    private $validator;

    public function urls() {

        $this->featureSet->loadForProject( $this->validator->getProject() );

        /**
         * @var $projectData ShapelessConcreteStruct[]
         */
        $projectData = ( new \Projects_ProjectDao() )->setCacheTTL( 60 * 60 )->getProjectData( $this->validator->getProject()->id );

        $formatted = new ProjectUrls( $projectData );

        $formatted = $this->featureSet->filter( 'projectUrls', $formatted );

        $this->response->json( [ 'urls' => $formatted->render() ] );

    }

    protected function validateRequest() {
        $this->validator->validate();
    }

    protected function afterConstruct() {
        $this->validator = new Validators\ProjectPasswordValidator( $this );
    }

}