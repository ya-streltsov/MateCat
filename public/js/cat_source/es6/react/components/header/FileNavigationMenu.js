let React = require('react'),
    SegmentStore = require('../../stores/SegmentStore'),
    SegmentActions = require('../../actions/SegmentActions'),
    SegmentConstants = require('../../constants/SegmentConstants');

class FileNavigationMenu extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            initDropdown: true
        };
        this.dropDown = null;
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    componentDidMount() {
        if(this.state.initDropdown){
            $(this.dropDown)
                .dropdown({
                    action: 'hide'
                });
            this.setState({
                initDropdown: false
            });
        }

    }

    goToCurrentSegment() {
        let currentSegment = SegmentStore.getCurrentSegment();
        setTimeout(()=>{SegmentActions.scrollToSegment(currentSegment.sid, currentSegment.fid)},0)
    }

    render() {
        const files = [];
        _.forEach(config.firstSegmentOfFiles, function (item, index) {
            const fileClass = UI.getIconClass(item.file_name.split('.')[item.file_name.split('.').length - 1])
            const file = <div className="item" key={index}>
                <i className={fileClass}></i>
                <p>{item.file_name}</p>
            </div>;
            files.push(file);
        });


        return <div id="fileNavigationMenu">
            <div className="ui dropdown button" ref={(ref) => this.dropDown = ref}>
                <span className="text">
                    {this.props.project_name}
                </span>
                <div className="menu">
                    <div className="header" onClick={this.goToCurrentSegment.bind(this)}>
                        Go to current segment
                    </div>
                    <div className="divider"></div>
                    {files}
                </div>
            </div>
            <p>({this.props.job_id}) &gt; <b>{this.props.source_rfc}</b> &gt;
                <b>{this.props.target_rfc}</b></p>
        </div>
    }
}

export default FileNavigationMenu;